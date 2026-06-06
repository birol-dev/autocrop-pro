import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Sun, Moon } from "lucide-react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { listen } from "@tauri-apps/api/event";

import { Toaster, toast } from "sonner";
import { classifyFile, VIDEO_EXTENSIONS, IMAGE_EXTENSIONS } from "@/lib/media";

// Import modular components
import SettingsSidebar from "@/components/SettingsSidebar";
import PreviewModal from "@/components/PreviewModal";
import GalleryModal from "@/components/GalleryModal";
import FileQueue from "@/components/FileQueue";

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
};

// ── Component ───────────────────────────────────────────────────────────────

export default function App() {
    const [dark, setDark] = useState(false);

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

    // Gallery state
    const [showGallery, setShowGallery] = useState(false);
    const [galleryFiles, setGalleryFiles] = useState<OutputFile[]>([]);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Debounce ref for tolerance changes
    const toleranceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── File Management ─────────────────────────────────────────────────────

    const addFilesFromPaths = useCallback((paths: string[]) => {
        const newFiles: MediaFile[] = [];
        for (const path of paths) {
            const fileType = classifyFile(path);
            if (!fileType) continue;

            const name = path.split('\\').pop()?.split('/').pop() || path;
            const previewUrl = convertFileSrc(path);

            newFiles.push({
                id: crypto.randomUUID(),
                path,
                name,
                type: fileType,
                previewUrl,
            });
        }

        if (newFiles.length > 0) {
            setFiles(prev => {
                const existingPaths = new Set(prev.map(f => f.path));
                const unique = newFiles.filter(f => !existingPaths.has(f.path));
                return [...prev, ...unique];
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
                        case 'over':
                        case 'enter':
                            setIsDragHovering(true);
                            break;
                        case 'leave':
                            setIsDragHovering(false);
                            break;
                        case 'drop':
                            setIsDragHovering(false);
                            if (Array.isArray(event.payload.paths)) {
                                addFilesFromPaths(event.payload.paths);
                            }
                            break;
                    }
                });
            } catch (err) {
                console.error("Drag-drop listener failed:", err);
            }
        })();

        return () => { unlisten?.(); };
    }, [isProcessing, addFilesFromPaths]);

    // ── HTML Fallback Dropzone ──────────────────────────────────────────────

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (isProcessing) return;
        const paths = acceptedFiles
            .map(f => (f as File & { path?: string }).path)
            .filter((p): p is string => Boolean(p));
        if (paths.length > 0) addFilesFromPaths(paths);
    }, [isProcessing, addFilesFromPaths]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        disabled: isProcessing,
        noDrag: true,
        accept: {
            'video/*': VIDEO_EXTENSIONS,
            'image/*': IMAGE_EXTENSIONS,
        },
    });

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

        return () => {
            if (toleranceTimerRef.current) clearTimeout(toleranceTimerRef.current);
        };
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
                const crop = await invoke<CropArea>("detect_crop_areas", {
                    filePath: file.path,
                    tolerance: options.tolerance,
                });
                setDetectedCrop(crop);
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, crop } : f));
            } catch (error) {
                toast.error(`Detection failed: ${String(error)}`);
            } finally {
                setDetectingCrop(false);
            }
        }
    };

    const closePreview = useCallback(() => {
        setPreviewFile(null);
        setDetectedCrop(null);
    }, []);

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
                    crop = await invoke<CropArea>("detect_crop_areas", {
                        filePath: file.path,
                        tolerance: options.tolerance,
                    });
                } catch {
                    crop = { w: 0, h: 0, x: 0, y: 0 };
                }
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
            await openGallery();
        } catch (error) {
            toast.error(`Processing failed: ${String(error)}`);
        } finally {
            setIsProcessing(false);
            setProgress(0);
            setProgressMsg("");
            unlisten?.();
        }
    };

    // ── Gallery ──────────────────────────────────────────────────────────────

    const openGallery = async () => {
        setGalleryLoading(true);
        setShowGallery(true);
        setLightboxIndex(null);
        try {
            const files = await invoke<OutputFile[]>("list_output_files");
            setGalleryFiles(files);
        } catch (err) {
            toast.error(`Failed to load gallery: ${String(err)}`);
        } finally {
            setGalleryLoading(false);
        }
    };

    const closeGallery = () => {
        setShowGallery(false);
        setLightboxIndex(null);
        setGalleryFiles([]);
    };

    // ── Render ──────────────────────────────────────────────────────────────

    const hasFiles = files.length > 0;

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

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Header */}
                <header
                    data-tauri-drag-region
                    className="h-[64px] flex items-center justify-between px-6 shrink-0 select-none"
                    style={{
                        borderBottom: `var(--border-w) solid var(--border)`,
                        background: "var(--bg)",
                    }}
                >
                    <div className="flex items-center gap-3 pointer-events-none">
                        {/* Logo mark */}
                        <div
                            className="w-9 h-9 flex items-center justify-center font-display font-900 text-sm"
                            style={{
                                background: "var(--pink)",
                                border: "var(--border-w) solid var(--border)",
                                borderRadius: "10px",
                                boxShadow: "var(--shadow)",
                                color: "#fff",
                                fontFamily: "'Nunito', sans-serif",
                                fontWeight: 900,
                            }}
                        >
                            AC
                        </div>
                        <h1
                            style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            AutoCrop Pro
                        </h1>
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

                {/* Dropzone + Queue */}
                <div className="flex-1 p-6 overflow-y-auto" style={{ gap: "1.5rem", display: "flex", flexDirection: "column" }}>
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`relative w-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{
                            minHeight: hasFiles ? "96px" : "220px",
                            border: `var(--border-w) ${isDragHovering ? "solid" : "dashed"} var(--${isDragHovering ? "pink" : "border"})`,
                            borderRadius: "var(--radius-xl)",
                            background: isDragHovering
                                ? "color-mix(in srgb, var(--pink) 8%, var(--bg))"
                                : "var(--bg-card)",
                            boxShadow: isDragHovering ? "var(--shadow-lg)" : "none",
                            transform: isDragHovering ? "scale(1.01)" : "scale(1)",
                        }}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            <div
                                className="flex items-center justify-center transition-transform duration-300"
                                style={{
                                    width: hasFiles ? "44px" : "60px",
                                    height: hasFiles ? "44px" : "60px",
                                    borderRadius: "14px",
                                    border: "var(--border-w) solid var(--border)",
                                    background: isDragHovering ? "var(--pink)" : "var(--surface)",
                                    boxShadow: "var(--shadow)",
                                    color: isDragHovering ? "#fff" : "var(--pink)",
                                    transition: "all 0.3s",
                                }}
                            >
                                <UploadCloud size={hasFiles ? 20 : 28} strokeWidth={2} />
                            </div>
                            <div className="text-center">
                                <p
                                    className="font-semibold"
                                    style={{
                                        fontFamily: "'Nunito', sans-serif",
                                        fontWeight: 700,
                                        fontSize: hasFiles ? "0.9rem" : "1.1rem",
                                        color: isDragHovering ? "var(--pink)" : "var(--text)",
                                    }}
                                >
                                    {isDragHovering ? "Release to add files" : "Drag & drop media files here"}
                                </p>
                                {!hasFiles && (
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                        Or click to browse your files
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* File Queue */}
                    {hasFiles && (
                        <FileQueue
                            files={files}
                            onPreviewFile={handlePreview}
                            onRemoveFile={removeFile}
                        />
                    )}
                </div>
            </main>

            {/* Settings Sidebar */}
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

            {/* Preview Modal */}
            <PreviewModal
                previewFile={previewFile}
                closePreview={closePreview}
                detectingCrop={detectingCrop}
                detectedCrop={detectedCrop}
            />

            {/* Gallery Modal */}
            <GalleryModal
                showGallery={showGallery}
                closeGallery={closeGallery}
                galleryFiles={galleryFiles}
                galleryLoading={galleryLoading}
                lightboxIndex={lightboxIndex}
                setLightboxIndex={setLightboxIndex}
            />
        </div>
    );
}
