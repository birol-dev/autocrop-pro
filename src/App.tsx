import { useState, useCallback, useEffect, useRef } from "react";
import { UploadCloud, Sun, Moon, Layers, FolderOpen, Settings } from "lucide-react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

import { Toaster, toast } from "sonner";
import { classifyFile } from "@/lib/media";

// Import modular components
import SettingsSidebar from "@/components/SettingsSidebar";
import PreviewModal from "@/components/PreviewModal";
import FileQueue from "@/components/FileQueue";
import OutputsPanel from "@/components/OutputsPanel";
import SettingsPanel from "@/components/SettingsPanel";

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

// ── Component ───────────────────────────────────────────────────────────────

export default function App() {
    const [dark, setDark] = useState(false);
    const [tab, setTab] = useState<Tab>("queue");
    const [outputsRefreshTick, setOutputsRefreshTick] = useState(0);

    // Sync dark class
    useEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
    }, [dark]);

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
            toast.error(`Failed to open file picker: ${String(err)}`);
        }
    }, [isProcessing, addFilesFromPaths]);

    // ── Tolerance Change (Debounced) ────────────────────────────────────────

    useEffect(() => {
        if (toleranceTimerRef.current) clearTimeout(toleranceTimerRef.current);
        toleranceTimerRef.current = setTimeout(() => {
            setFiles(prev => prev.map(f => ({ ...f, crop: undefined })));
            if (previewFile) {
                setDetectingCrop(true);
                invoke<CropArea>("detect_crop_areas", { filePath: previewFile.path, tolerance: options.tolerance })
                    .then(crop => {
                        setDetectedCrop(crop);
                        setFiles(prev => prev.map(f => f.id === previewFile.id ? { ...f, crop } : f));
                    })
                    .catch(err => toast.error(`Detection failed: ${String(err)}`))
                    .finally(() => setDetectingCrop(false));
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
            setDetectingCrop(true);
            try {
                const crop = await invoke<CropArea>("detect_crop_areas", { filePath: file.path, tolerance: options.tolerance });
                setDetectedCrop(crop);
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, crop } : f));
            } catch (error) {
                toast.error(`Detection failed: ${String(error)}`);
            } finally { setDetectingCrop(false); }
        }
    };

    const closePreview = useCallback(() => { setPreviewFile(null); setDetectedCrop(null); }, []);

    // ── Process All ─────────────────────────────────────────────────────────

    const handleProcessAll = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setProgress(0);
        setProgressMsg("Detecting crop regions...");

        const itemsToProcess = [];
        for (const file of files) {
            let crop = file.crop;
            if (!crop) {
                try {
                    crop = await invoke<CropArea>("detect_crop_areas", { filePath: file.path, tolerance: options.tolerance });
                } catch { crop = { w: 0, h: 0, x: 0, y: 0 }; }
            }
            itemsToProcess.push({ path: file.path, crop });
        }

        setProgressMsg("Processing files...");
        let unlisten: (() => void) | undefined;
        try {
            unlisten = await listen<ProgressEventPayload>("crop-progress", (event) => {
                const pct = (event.payload.current / event.payload.total) * 100;
                setProgress(Math.min(pct, 100));
                setProgressMsg(event.payload.message);
            });
            await invoke("process_files", { items: itemsToProcess, options });
            setFiles([]);
            // Switch to outputs tab and refresh
            setTab("outputs");
            setOutputsRefreshTick(t => t + 1);
        } catch (error) {
            toast.error(`Processing failed: ${String(error)}`);
        } finally {
            setIsProcessing(false);
            setProgress(0);
            setProgressMsg("");
            unlisten?.();
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    const hasFiles = files.length > 0;

    const tabDef: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "queue", label: "Queue", icon: <Layers size={15} /> },
        { id: "outputs", label: "Outputs", icon: <FolderOpen size={15} /> },
        { id: "settings", label: "Settings", icon: <Settings size={15} /> },
    ];

    return (
        <div
            className="flex h-screen w-full overflow-hidden"
            style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Space Grotesk', sans-serif" }}
        >
            <Toaster
                theme={dark ? "dark" : "light"}
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: "var(--surface)",
                        border: "var(--border-w) solid var(--border)",
                        color: "var(--text)",
                        borderRadius: "16px",
                        boxShadow: "var(--shadow)",
                        fontFamily: "'Space Grotesk', sans-serif",
                    }
                }}
            />

            <main className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Header */}
                <header
                    data-tauri-drag-region
                    className="h-[64px] flex items-center justify-between px-6 shrink-0 select-none"
                    style={{ borderBottom: "var(--border-w) solid var(--border)", background: "var(--bg)" }}
                >
                    {/* Logo + Title */}
                    <div className="flex items-center gap-3 pointer-events-none">
                        <img
                            src="/logo.png"
                            alt="AutoCrop Pro"
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                border: "var(--border-w) solid var(--border)",
                                boxShadow: "var(--shadow)",
                                objectFit: "cover",
                            }}
                        />
                        <h1
                            style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                letterSpacing: "-0.01em",
                                margin: 0,
                            }}
                        >
                            AutoCrop Pro
                        </h1>
                    </div>

                    {/* Tab bar */}
                    <div
                        className="flex items-center gap-1 pointer-events-auto"
                        style={{
                            border: "var(--border-w) solid var(--border)",
                            borderRadius: "14px",
                            background: "var(--bg-card)",
                            padding: "4px",
                            boxShadow: "var(--shadow)",
                        }}
                    >
                        {tabDef.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className="flex items-center gap-2 transition-all duration-150"
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "10px",
                                    border: tab === t.id ? "var(--border-w) solid var(--border)" : "2px solid transparent",
                                    background: tab === t.id ? "var(--text)" : "transparent",
                                    color: tab === t.id ? "var(--bg)" : "var(--text-muted)",
                                    fontFamily: "'Nunito', sans-serif",
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    boxShadow: tab === t.id ? "2px 2px 0 var(--border)" : "none",
                                }}
                            >
                                {t.icon}
                                {t.label}
                                {t.id === "queue" && hasFiles && (
                                    <span
                                        style={{
                                            background: "var(--pink)",
                                            color: "#fff",
                                            borderRadius: "6px",
                                            padding: "0 6px",
                                            fontSize: "0.7rem",
                                            fontWeight: 800,
                                            border: "1px solid var(--border)",
                                        }}
                                    >
                                        {files.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Theme toggle */}
                    <button
                        onClick={() => setDark(d => !d)}
                        className="pointer-events-auto flex items-center justify-center w-9 h-9 transition-transform hover:scale-105 active:scale-95"
                        style={{
                            border: "var(--border-w) solid var(--border)",
                            borderRadius: "10px",
                            background: "var(--surface)",
                            boxShadow: "var(--shadow)",
                            color: "var(--text)",
                            cursor: "pointer",
                        }}
                        title="Toggle theme"
                    >
                        {dark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </header>

                {/* Tab content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
                    {/* ── Queue Tab ─────────────────────────────────────────── */}
                    {tab === "queue" && (
                        <>
                            {/* Dropzone */}
                            <div
                                onClick={handleDropzoneClick}
                                className={`relative w-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                                style={{
                                    minHeight: hasFiles ? "96px" : "220px",
                                    border: `var(--border-w) ${isDragHovering ? "solid" : "dashed"} var(--${isDragHovering ? "pink" : "border"})`,
                                    borderRadius: "var(--radius-xl)",
                                    background: isDragHovering ? "color-mix(in srgb, var(--pink) 8%, var(--bg))" : "var(--bg-card)",
                                    boxShadow: isDragHovering ? "var(--shadow-lg)" : "none",
                                    transform: isDragHovering ? "scale(1.01)" : "scale(1)",
                                }}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        className="flex items-center justify-center transition-all duration-300"
                                        style={{
                                            width: hasFiles ? "44px" : "60px",
                                            height: hasFiles ? "44px" : "60px",
                                            borderRadius: "14px",
                                            border: "var(--border-w) solid var(--border)",
                                            background: isDragHovering ? "var(--pink)" : "var(--surface)",
                                            boxShadow: "var(--shadow)",
                                            color: isDragHovering ? "#fff" : "var(--pink)",
                                        }}
                                    >
                                        <UploadCloud size={hasFiles ? 20 : 28} strokeWidth={2} />
                                    </div>
                                    <div className="text-center">
                                        <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: hasFiles ? "0.9rem" : "1.1rem", color: isDragHovering ? "var(--pink)" : "var(--text)", margin: 0 }}>
                                            {isDragHovering ? "Release to add files" : "Drag & drop media files here"}
                                        </p>
                                        {!hasFiles && (
                                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Or click to browse your files</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {hasFiles && (
                                <FileQueue files={files} onPreviewFile={handlePreview} onRemoveFile={removeFile} />
                            )}
                        </>
                    )}

                    {/* ── Outputs Tab ───────────────────────────────────────── */}
                    {tab === "outputs" && (
                        <OutputsPanel refreshTick={outputsRefreshTick} />
                    )}

                    {/* ── Settings Tab ──────────────────────────────────────── */}
                    {tab === "settings" && (
                        <SettingsPanel />
                    )}
                </div>
            </main>

            {/* Settings Sidebar — only show when not on settings tab */}
            {tab !== "settings" && (
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
            )}

            {/* Preview Modal */}
            <PreviewModal
                previewFile={previewFile}
                closePreview={closePreview}
                detectingCrop={detectingCrop}
                detectedCrop={detectedCrop}
            />
        </div>
    );
}
