import { useState, useCallback, useEffect, useRef } from "react";
import {
    ActionIcon,
    AppShell,
    Badge,
    Center,
    Group,
    Image,
    Progress,
    SegmentedControl,
    Stack,
    Text,
    Tooltip,
    useComputedColorScheme,
    useMantineColorScheme,
} from "@mantine/core";
import { FolderOpenIcon, GearSixIcon, MoonIcon, StackIcon, SunIcon } from "@phosphor-icons/react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

import { classifyFile } from "@/lib/media";
import { notifyError, notifySuccess, notifyWarning } from "@/lib/notify";

// Import modular components
import SettingsSidebar from "@/components/SettingsSidebar";
import PreviewModal from "@/components/PreviewModal";
import FileQueue from "@/components/FileQueue";
import OutputsPanel from "@/components/OutputsPanel";
import SettingsPanel from "@/components/SettingsPanel";
import Dropzone from "@/components/Dropzone";

import classes from "./App.module.css";

// ── Types ───────────────────────────────────────────────────────────────────

export type CropArea = {
    w: number;
    h: number;
    x: number;
    y: number;
};

export type MediaFile = {
    id: string;
    path: string;
    name: string;
    type: "video" | "image";
    crop?: CropArea;
    previewUrl?: string;
};

export type ProcessOptions = {
    tolerance: number;
    output_format: string;
    padding: boolean;
    delete_original: boolean;
};

type ProgressEventPayload = {
    current: number;
    total: number;
    message: string;
};

export type OutputFile = {
    name: string;
    path: string;
    file_type: string;
    modified_at: number;
};

type Tab = "queue" | "outputs" | "settings";

const NAV_ITEMS: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: "queue", label: "Queue", icon: <StackIcon size={16} weight="bold" /> },
    { value: "outputs", label: "Outputs", icon: <FolderOpenIcon size={16} weight="bold" /> },
    { value: "settings", label: "Settings", icon: <GearSixIcon size={16} weight="bold" /> },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function App() {
    const [tab, setTab] = useState<Tab>("queue");
    const [outputsRefreshTick, setOutputsRefreshTick] = useState(0);

    const { setColorScheme } = useMantineColorScheme();
    const computedScheme = useComputedColorScheme("light", { getInitialValueInEffect: false });

    // Application state
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState("");

    // Preview modal state
    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
    const [detectingCrop, setDetectingCrop] = useState(false);
    const [detectedCrop, setDetectedCrop] = useState<CropArea | null>(null);

    // Options
    const [options, setOptions] = useState<ProcessOptions>({
        tolerance: 20,
        output_format: "Same as source",
        padding: false,
        delete_original: false,
    });

    const [isDragHovering, setIsDragHovering] = useState(false);
    const toleranceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Bumped whenever a detection is superseded (new request, preview closed) so stale results are dropped.
    const detectGenRef = useRef(0);
    const toleranceReadyRef = useRef(false);

    // ── File Management ─────────────────────────────────────────────────────

    const addFilesFromPaths = useCallback((paths: string[]) => {
        const newFiles: MediaFile[] = [];
        for (const path of paths) {
            const fileType = classifyFile(path);
            if (!fileType) continue;
            const name = path.split('\\').pop()?.split('/').pop() || path;
            const previewUrl = convertFileSrc(path);
            newFiles.push({ id: crypto.randomUUID(), path, name, type: fileType, previewUrl });
        }
        if (newFiles.length > 0) {
            setFiles(prev => {
                const existingPaths = new Set(prev.map(f => f.path));
                return [...prev, ...newFiles.filter(f => !existingPaths.has(f.path))];
            });
        }
    }, []);

    const removeFile = useCallback((id: string) => {
        if (isProcessing) return;
        setFiles(prev => prev.filter(f => f.id !== id));
    }, [isProcessing]);

    const clearFiles = useCallback(() => {
        if (isProcessing) return;
        setFiles([]);
    }, [isProcessing]);

    // ── Tauri Native Drag & Drop ────────────────────────────────────────────

    useEffect(() => {
        let unlisten: (() => void) | undefined;
        (async () => {
            try {
                unlisten = await getCurrentWebview().onDragDropEvent((event) => {
                    if (isProcessing) return;
                    switch (event.payload.type) {
                        case 'over': case 'enter': setIsDragHovering(true); break;
                        case 'leave': setIsDragHovering(false); break;
                        case 'drop':
                            setIsDragHovering(false);
                            if (Array.isArray(event.payload.paths)) addFilesFromPaths(event.payload.paths);
                            break;
                    }
                });
            } catch (err) { console.error("Drag-drop listener failed:", err); }
        })();
        return () => { unlisten?.(); };
    }, [isProcessing, addFilesFromPaths]);

    // ── HTML Click-to-Browse (via Tauri native dialog) ─────────────────────

    const handleDropzoneClick = useCallback(async () => {
        if (isProcessing) return;
        try {
            const selected = await openDialog({
                multiple: true,
                filters: [{
                    name: 'Media Files',
                    extensions: [
                        'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv',
                        'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'gif'
                    ]
                }]
            });
            if (selected) {
                const paths = Array.isArray(selected) ? selected : [selected];
                addFilesFromPaths(paths);
            }
        } catch (err) {
            notifyError(`Failed to open file picker: ${String(err)}`);
        }
    }, [isProcessing, addFilesFromPaths]);

    // ── Tolerance Change (Debounced) ────────────────────────────────────────

    useEffect(() => {
        // Skip the initial mount — only react to user tolerance changes.
        if (!toleranceReadyRef.current) {
            toleranceReadyRef.current = true;
            return;
        }
        if (toleranceTimerRef.current) clearTimeout(toleranceTimerRef.current);
        toleranceTimerRef.current = setTimeout(() => {
            setFiles(prev => prev.map(f => ({ ...f, crop: undefined })));
            if (previewFile) {
                const gen = ++detectGenRef.current;
                setDetectingCrop(true);
                invoke<CropArea>("detect_crop_areas", { filePath: previewFile.path, tolerance: options.tolerance })
                    .then(crop => {
                        if (gen !== detectGenRef.current) return;
                        setDetectedCrop(crop);
                        setFiles(prev => prev.map(f => f.id === previewFile.id ? { ...f, crop } : f));
                    })
                    .catch(err => {
                        if (gen !== detectGenRef.current) return;
                        notifyError(`Detection failed: ${String(err)}`);
                    })
                    .finally(() => {
                        if (gen === detectGenRef.current) setDetectingCrop(false);
                    });
            }
        }, 300);
        return () => { if (toleranceTimerRef.current) clearTimeout(toleranceTimerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.tolerance]);

    // ── Preview ─────────────────────────────────────────────────────────────

    const handlePreview = async (file: MediaFile) => {
        if (isProcessing) return;
        setPreviewFile(file);
        setDetectedCrop(file.crop || null);
        if (!file.crop && file.path) {
            const gen = ++detectGenRef.current;
            setDetectingCrop(true);
            try {
                const crop = await invoke<CropArea>("detect_crop_areas", { filePath: file.path, tolerance: options.tolerance });
                if (gen !== detectGenRef.current) return;
                setDetectedCrop(crop);
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, crop } : f));
            } catch (error) {
                if (gen !== detectGenRef.current) return;
                notifyError(`Detection failed: ${String(error)}`);
            } finally {
                if (gen === detectGenRef.current) setDetectingCrop(false);
            }
        }
    };

    const closePreview = useCallback(() => {
        detectGenRef.current += 1;
        setPreviewFile(null);
        setDetectedCrop(null);
        setDetectingCrop(false);
    }, []);

    // ── Process All ─────────────────────────────────────────────────────────

    const handleProcessAll = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setProgress(0);
        setProgressMsg("Detecting crop regions...");

        const itemsToProcess = [];
        const failedDetect: string[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let crop = file.crop;
            if (!crop) {
                setProgressMsg(`Detecting crop ${i + 1}/${files.length}…`);
                try {
                    crop = await invoke<CropArea>("detect_crop_areas", { filePath: file.path, tolerance: options.tolerance });
                } catch {
                    crop = { w: 0, h: 0, x: 0, y: 0 };
                    failedDetect.push(file.name);
                }
            }
            itemsToProcess.push({ path: file.path, crop });
        }

        if (failedDetect.length > 0) {
            notifyWarning(
                `Crop detection failed for ${failedDetect.length} file${failedDetect.length === 1 ? "" : "s"}; exporting full frame instead.`,
            );
        }

        setProgressMsg("Processing files...");
        let unlisten: (() => void) | undefined;
        try {
            unlisten = await listen<ProgressEventPayload>("crop-progress", (event) => {
                const { current, total, message } = event.payload;
                const pct = total > 0 ? (current / total) * 100 : 0;
                setProgress(Math.min(pct, 100));
                setProgressMsg(message);
            });
            await invoke("process_files", { items: itemsToProcess, options });
            setFiles([]);
            // Switch to outputs tab and refresh
            setTab("outputs");
            setOutputsRefreshTick(t => t + 1);
            notifySuccess("Processing complete");
        } catch (error) {
            notifyError(`Processing failed: ${String(error)}`);
        } finally {
            setIsProcessing(false);
            setProgress(0);
            setProgressMsg("");
            unlisten?.();
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    const hasFiles = files.length > 0;

    return (
        <AppShell
            header={{ height: 60 }}
            aside={{
                width: 330,
                breakpoint: 0,
                // Export settings only matter while building the queue.
                collapsed: { desktop: tab !== "queue", mobile: tab !== "queue" },
            }}
            padding="lg"
        >
            <AppShell.Header data-tauri-drag-region>
                <div className={classes.header}>
                    <Group gap="sm" wrap="nowrap" className={classes.brand}>
                        <Image src="/logo.png" alt="" w={32} h={32} radius="md" />
                        <Text fw={700} fz="lg" lts="-0.01em" visibleFrom="xs">
                            AutoCrop Pro
                        </Text>
                    </Group>

                    <SegmentedControl
                        value={tab}
                        onChange={(v) => setTab(v as Tab)}
                        radius="md"
                        size="md"
                        data={NAV_ITEMS.map((t) => ({
                            value: t.value,
                            label: (
                                <Center inline style={{ gap: 8 }}>
                                    {t.icon}
                                    <span>{t.label}</span>
                                    {t.value === "queue" && hasFiles && (
                                        <Badge size="sm" circle={files.length < 10} px={files.length < 10 ? 0 : 6}>
                                            {files.length}
                                        </Badge>
                                    )}
                                </Center>
                            ),
                        }))}
                    />

                    <Group justify="flex-end">
                        <Tooltip label={computedScheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
                            <ActionIcon
                                variant="default"
                                size={36}
                                aria-label="Toggle colour theme"
                                onClick={() => setColorScheme(computedScheme === "dark" ? "light" : "dark")}
                            >
                                {computedScheme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </div>

                {isProcessing && (
                    <Progress
                        value={progress}
                        size={3}
                        radius={0}
                        animated
                        className={classes.globalProgress}
                        aria-label="Processing progress"
                    />
                )}
            </AppShell.Header>

            <AppShell.Main className={classes.main}>
                {/* ── Queue Tab ─────────────────────────────────────────── */}
                {tab === "queue" && (
                    <Stack gap="xl">
                        <Dropzone
                            isDragHovering={isDragHovering}
                            isProcessing={isProcessing}
                            compact={hasFiles}
                            onBrowse={handleDropzoneClick}
                        />

                        {hasFiles && (
                            <FileQueue
                                files={files}
                                disabled={isProcessing}
                                onPreviewFile={handlePreview}
                                onRemoveFile={removeFile}
                                onClear={clearFiles}
                            />
                        )}
                    </Stack>
                )}

                {/* ── Outputs Tab ───────────────────────────────────────── */}
                {tab === "outputs" && (
                    <OutputsPanel refreshTick={outputsRefreshTick} onGoToQueue={() => setTab("queue")} />
                )}

                {/* ── Settings Tab ──────────────────────────────────────── */}
                {tab === "settings" && <SettingsPanel />}
            </AppShell.Main>

            <AppShell.Aside>
                <SettingsSidebar
                    options={options}
                    setOptions={setOptions}
                    hasFiles={hasFiles}
                    isProcessing={isProcessing}
                    progress={progress}
                    progressMsg={progressMsg}
                    filesCount={files.length}
                    onProcessAll={handleProcessAll}
                />
            </AppShell.Aside>

            {/* Preview Modal */}
            <PreviewModal
                previewFile={previewFile}
                closePreview={closePreview}
                detectingCrop={detectingCrop}
                detectedCrop={detectedCrop}
            />
        </AppShell>
    );
}
