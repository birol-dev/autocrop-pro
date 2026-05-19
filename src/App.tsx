import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Settings, UploadCloud } from "lucide-react";
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
        // Cancel any pending redetection
        if (toleranceTimerRef.current) clearTimeout(toleranceTimerRef.current);

        toleranceTimerRef.current = setTimeout(() => {
            // Invalidate all cached crops
            setFiles(prev => prev.map(f => ({ ...f, crop: undefined })));

            // Re-detect for the currently previewed file
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

        // Ensure every file has crop data
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
            // Auto-open gallery after successful processing
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
        <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
            <Toaster theme="dark" position="bottom-right" className="font-sans" toastOptions={{
                className: "bg-zinc-900/90 backdrop-blur-xl border-zinc-800 text-zinc-100 shadow-2xl"
            }} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative h-full">
                <header data-tauri-drag-region className="h-[68px] flex items-center justify-between px-8 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md z-20 shrink-0 select-none">
                    <div className="flex items-center gap-3 pointer-events-none">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Settings size={16} className="text-white" />
                        </div>
                        <h1 className="text-sm font-semibold tracking-wide text-zinc-100">AutoCrop Pro</h1>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-hide">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`group relative w-full rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden border-2
                            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                            ${hasFiles ? 'h-32 bg-zinc-900/20 border-zinc-800/50 hover:border-indigo-500/30' : 'h-64 bg-zinc-900/40 border-dashed border-zinc-700/50 hover:border-indigo-500/50 hover:bg-zinc-900/60'}
                            ${isDragHovering ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-2xl shadow-indigo-500/20 z-10' : ''}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`p-4 rounded-2xl bg-zinc-800/50 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-300 shadow-xl ${hasFiles ? 'scale-75 mb-0 p-3' : ''}`}>
                                <UploadCloud size={hasFiles ? 24 : 32} strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <p className={`font-medium text-zinc-200 transition-all duration-300 ${hasFiles ? 'text-sm' : 'text-lg'}`}>
                                    {isDragHovering ? "Release to add files" : "Drag & drop media files here"}
                                </p>
                                {!hasFiles && (
                                    <p className="text-xs text-zinc-500 mt-2 font-medium">Or click to browse your files</p>
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
