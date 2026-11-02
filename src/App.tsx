import { useState, useCallback, useEffect, useRef } from "react";
import { Switch, Tooltip, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { FolderPlusIcon, MoonIcon, PlusIcon, SunIcon, TrashIcon } from "@phosphor-icons/react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

import { classifyFile } from "@/lib/media";
import { notifyError, notifySuccess, notifyWarning } from "@/lib/notify";

// Import modular components
import OutputsPanel from "@/components/OutputsPanel";
import SettingsPanel from "@/components/SettingsPanel";
import Dropzone from "@/components/Dropzone";
import CropStage from "@/components/workbench/CropStage";
import ExportControls, { switchClasses } from "@/components/workbench/ExportControls";
import QueueRow from "@/components/workbench/QueueRow";
import { WindowBar, summarize, workbench } from "@/components/workbench/Workbench";

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
    error?: string;
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
    path: string;
    error: string | null;
};

export type OutputFile = {
    name: string;
    path: string;
    file_type: string;
    modified_at: number;
};

type Tab = "queue" | "outputs" | "settings";

const FORMATS = [
    { value: "Same as source", label: "Same as source" },
    { value: "png", label: "PNG (lossless)" },
    { value: "jpg", label: "JPEG (smaller)" },
    { value: "webp", label: "WebP" },
];

const MEDIA_EXTENSIONS = [
    'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv',
    'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'gif'
];

// ── Component ───────────────────────────────────────────────────────────────

export default function App() {
    const [tab, setTab] = useState<Tab>("queue");
    const [outputsRefreshTick, setOutputsRefreshTick] = useState(0);

    const { setColorScheme } = useMantineColorScheme();
    const computedScheme = useComputedColorScheme("light", { getInitialValueInEffect: false });

    // Application state
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState("");
    const [detecting, setDetecting] = useState(false);

    // Options
    const [options, setOptions] = useState<ProcessOptions>({
        tolerance: 20,
        output_format: "Same as source",
        padding: false,
        delete_original: false,
    });

    const [isDragHovering, setIsDragHovering] = useState(false);
    const toleranceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Bumped whenever a detection is superseded (new request, other file selected) so stale results are dropped.
    const detectGenRef = useRef(0);
    const toleranceReadyRef = useRef(false);

    const selected = files.find(f => f.id === selectedId) ?? files[0] ?? null;

    // ── File Management ─────────────────────────────────────────────────────

    /** Takes files and folders alike: folders are walked by the backend. */
    const addFilesFromPaths = useCallback(async (paths: string[]) => {
        let found: string[];
        try {
            found = await invoke<string[]>("expand_paths", { paths });
        } catch (err) {
            notifyError(`Could not read that folder: ${String(err)}`);
            return;
        }

        const newFiles: MediaFile[] = [];
        for (const path of found) {
            const fileType = classifyFile(path);
            if (!fileType) continue;
            const name = path.split('\\').pop()?.split('/').pop() || path;
            const previewUrl = convertFileSrc(path);
            newFiles.push({ id: crypto.randomUUID(), path, name, type: fileType, previewUrl });
        }

        if (newFiles.length === 0) {
            notifyWarning("No images or videos in there.");
            return;
        }
        setTab("queue");
        setFiles(prev => {
            const existingPaths = new Set(prev.map(f => f.path));
            return [...prev, ...newFiles.filter(f => !existingPaths.has(f.path))];
        });
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
        let cancelled = false;
        (async () => {
            try {
                const stop = await getCurrentWebview().onDragDropEvent((event) => {
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
                if (cancelled) stop();
                else unlisten = stop;
            } catch (err) { console.error("Drag-drop listener failed:", err); }
        })();
        return () => { cancelled = true; unlisten?.(); };
    }, [isProcessing, addFilesFromPaths]);

    // ── Native Pickers ──────────────────────────────────────────────────────

    const browseFiles = useCallback(async () => {
        if (isProcessing) return;
        try {
            const selection = await openDialog({
                multiple: true,
                filters: [{ name: 'Media Files', extensions: MEDIA_EXTENSIONS }]
            });
            if (selection) addFilesFromPaths(Array.isArray(selection) ? selection : [selection]);
        } catch (err) {
            notifyError(`Failed to open file picker: ${String(err)}`);
        }
    }, [isProcessing, addFilesFromPaths]);

    const browseFolder = useCallback(async () => {
        if (isProcessing) return;
        try {
            const selection = await openDialog({ directory: true, multiple: true, title: "Add a folder" });
            if (selection) addFilesFromPaths(Array.isArray(selection) ? selection : [selection]);
        } catch (err) {
            notifyError(`Failed to open folder picker: ${String(err)}`);
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
            setFiles(prev => prev.map(f => ({ ...f, crop: undefined, error: undefined })));
        }, 300);
        return () => { if (toleranceTimerRef.current) clearTimeout(toleranceTimerRef.current); };
    }, [options.tolerance]);

    // ── Detection for the Selected File ─────────────────────────────────────

    const selectedKey = selected && !selected.crop && !selected.error && !isProcessing ? selected.id : null;
    const selectedPath = selected?.path;

    useEffect(() => {
        detectGenRef.current += 1;
        if (!selectedKey || !selectedPath) {
            setDetecting(false);
            return;
        }
        const gen = detectGenRef.current;
        setDetecting(true);
        invoke<CropArea>("detect_crop_areas", { filePath: selectedPath, tolerance: options.tolerance })
            .then(crop => {
                if (gen !== detectGenRef.current) return;
                setFiles(prev => prev.map(f => f.id === selectedKey ? { ...f, crop } : f));
            })
            .catch(err => {
                if (gen !== detectGenRef.current) return;
                setFiles(prev => prev.map(f => f.id === selectedKey ? { ...f, error: String(err) } : f));
            })
            .finally(() => {
                if (gen === detectGenRef.current) setDetecting(false);
            });
        // The tolerance effect clears `crop`, which changes selectedKey, so it isn't a dependency here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedKey, selectedPath]);

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
        const finished = new Set<string>();
        const failed = new Map<string, string>();
        try {
            unlisten = await listen<ProgressEventPayload>("crop-progress", (event) => {
                const { current, total, message, path, error } = event.payload;
                const pct = total > 0 ? (current / total) * 100 : 0;
                setProgress(Math.min(pct, 100));
                setProgressMsg(message);
                if (error) failed.set(path, error);
                else finished.add(path);
            });
            await invoke("process_files", { items: itemsToProcess, options });
            setFiles([]);
            // Switch to outputs tab and refresh
            setTab("outputs");
            notifySuccess("Processing complete");
        } catch (error) {
            // Only the failures stay queued: running the rest again would make duplicates,
            // and with Delete originals on, their sources are already gone.
            setFiles(prev => prev
                .filter(f => !finished.has(f.path))
                .map(f => ({ ...f, error: failed.get(f.path) ?? f.error })));
            notifyError(`Processing failed: ${String(error)}`);
        } finally {
            setOutputsRefreshTick(t => t + 1);
            setIsProcessing(false);
            setProgress(0);
            setProgressMsg("");
            unlisten?.();
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    const hasFiles = files.length > 0;

    return (
        <div className={`${workbench.window} ${classes.shell}`}>
            <WindowBar
                tabs={[
                    { value: "queue", label: "Queue", count: files.length },
                    { value: "outputs", label: "Outputs" },
                    { value: "settings", label: "Settings" },
                ]}
                active={tab}
                onChange={setTab}
                progress={isProcessing ? progress / 100 : null}
                brand={
                    <div className={classes.brand}>
                        <img src="/logo.png" alt="" className={classes.logo} />
                        <span className={classes.appName}>AutoCrop Pro</span>
                    </div>
                }
            >
                <Tooltip label={computedScheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
                    <button
                        type="button"
                        className={workbench.iconButton}
                        aria-label="Toggle colour theme"
                        onClick={() => setColorScheme(computedScheme === "dark" ? "light" : "dark")}
                    >
                        {computedScheme === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
                    </button>
                </Tooltip>
            </WindowBar>

            <main className={classes.main}>
                {/* ── Queue Tab ─────────────────────────────────────────── */}
                {tab === "queue" && !hasFiles && (
                    <Dropzone isDragHovering={isDragHovering} onBrowseFiles={browseFiles} onBrowseFolder={browseFolder} />
                )}

                {tab === "queue" && hasFiles && selected && (
                    <div className={workbench.body}>
                        <aside className={workbench.side}>
                            <div className={workbench.sideHead}>
                                <span className={workbench.sideTitle}>{summarize(files)}</span>
                                <div className={workbench.sideActions}>
                                    <Tooltip label="Add files">
                                        <button type="button" className={workbench.iconButton} aria-label="Add files" disabled={isProcessing} onClick={browseFiles}>
                                            <PlusIcon size={16} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip label="Add a folder">
                                        <button type="button" className={workbench.iconButton} aria-label="Add a folder" disabled={isProcessing} onClick={browseFolder}>
                                            <FolderPlusIcon size={16} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip label="Clear the queue">
                                        <button type="button" className={workbench.iconButton} aria-label="Clear the queue" disabled={isProcessing} onClick={clearFiles}>
                                            <TrashIcon size={16} />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                            <ul className={workbench.rows}>
                                {files.map((f) => {
                                    const ext = f.name.split(".").pop()?.toUpperCase();
                                    const isCurrent = f.id === selected.id;
                                    return (
                                        <QueueRow
                                            key={f.id}
                                            name={f.name}
                                            meta={f.crop && f.crop.w > 0 ? `${f.crop.w} × ${f.crop.h}` : `${f.type === "video" ? "Video" : "Image"}${ext ? ` · ${ext}` : ""}`}
                                            src={f.previewUrl}
                                            type={f.type}
                                            active={isCurrent}
                                            state={f.error ? "error" : f.crop ? "ready" : isCurrent && detecting ? "busy" : "idle"}
                                            error={f.error}
                                            disabled={isProcessing}
                                            onSelect={() => setSelectedId(f.id)}
                                            onRemove={() => removeFile(f.id)}
                                        />
                                    );
                                })}
                            </ul>
                        </aside>

                        <section className={workbench.detail} aria-label="Preview and export">
                            <CropStage
                                key={selected.id}
                                src={selected.previewUrl}
                                type={selected.type}
                                name={selected.name}
                                crop={selected.crop ?? null}
                                pending={!selected.crop && !selected.error}
                                padding={options.padding ? 10 : 0}
                                error={selected.error}
                            />
                            <ExportControls
                                tolerance={options.tolerance}
                                onTolerance={(tolerance) => setOptions((o) => ({ ...o, tolerance }))}
                                format={options.output_format}
                                formats={FORMATS}
                                onFormat={(output_format) => setOptions((o) => ({ ...o, output_format }))}
                                padding={options.padding}
                                onPadding={(padding) => setOptions((o) => ({ ...o, padding }))}
                                extra={
                                    <Switch
                                        label="Delete originals"
                                        withThumbIndicator={false}
                                        color="var(--ink)"
                                        classNames={{
                                            ...switchClasses,
                                            label: options.delete_original ? workbench.danger : switchClasses.label,
                                        }}
                                        checked={options.delete_original}
                                        disabled={isProcessing}
                                        onChange={(e) => {
                                            const delete_original = e.currentTarget.checked;
                                            if (
                                                delete_original &&
                                                !window.confirm(
                                                    "Delete originals permanently removes source files after a successful crop. Continue?",
                                                )
                                            ) {
                                                return;
                                            }
                                            setOptions((o) => ({ ...o, delete_original }));
                                        }}
                                    />
                                }
                                fileCount={files.length}
                                busy={isProcessing}
                                status={isProcessing ? progressMsg : undefined}
                                note="Applied to every file. Videos keep their format; GIFs become a still PNG."
                                onProcess={handleProcessAll}
                            />
                        </section>
                    </div>
                )}

                {/* ── Outputs Tab ───────────────────────────────────────── */}
                {tab === "outputs" && (
                    <OutputsPanel refreshTick={outputsRefreshTick} onGoToQueue={() => setTab("queue")} />
                )}

                {/* ── Settings Tab ──────────────────────────────────────── */}
                {tab === "settings" && <SettingsPanel />}
            </main>

            {isDragHovering && hasFiles && (
                <div className={classes.dropVeil} aria-hidden="true">
                    Drop to add to the queue
                </div>
            )}
        </div>
    );
}
