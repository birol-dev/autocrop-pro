import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Settings, Image as ImageIcon, Video, Trash2, Play, CheckCircle2, ChevronRight, UploadCloud } from "lucide-react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { listen } from "@tauri-apps/api/event";

import { Toaster, toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    size?: number;
    type: "video" | "image";
    crop?: CropArea;
    previewUrl?: string;
};

type ProcessOptions = {
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

export default function App() {
    // --- Application State ---
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState("");

    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
    const [detectingCrop, setDetectingCrop] = useState(false);
    const [detectedCrop, setDetectedCrop] = useState<CropArea | null>(null);

    const [options, setOptions] = useState<ProcessOptions>({
        tolerance: 20,
        output_format: "Same as source",
        padding: false,
        delete_original: false,
    });

    const [isDragHovering, setIsDragHovering] = useState(false);

    // --- Helpers ---
    const addFilesFromPaths = useCallback(async (paths: string[]) => {
        const newFiles: MediaFile[] = [];
        for (const path of paths) {
            const pLower = path.toLowerCase();
            const isVideo = pLower.endsWith(".mp4") || pLower.endsWith(".mov") || pLower.endsWith(".avi") || pLower.endsWith(".mkv");
            const isImage = pLower.endsWith(".png") || pLower.endsWith(".jpg") || pLower.endsWith(".jpeg") || pLower.endsWith(".webp");

            if (!isVideo && !isImage) continue;

            // Robust filename extraction for Windows and Unix paths
            const name = path.split('\\').pop()?.split('/').pop() || path;
            const previewUrl = convertFileSrc(path);

            newFiles.push({
                id: crypto.randomUUID(), // Standard UUID instead of Math.random
                path,
                name,
                type: isVideo ? "video" : "image",
                previewUrl
            });
        }

        if (newFiles.length > 0) {
            setFiles(prev => {
                const existingPaths = new Set(prev.map(f => f.path));
                const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
                return [...prev, ...uniqueNewFiles];
            });
        }
    }, []);

    // --- Tauri Drag & Drop Listeners ---
    useEffect(() => {
        let unlistenDrop: () => void;

        async function setupListeners() {
            try {
                unlistenDrop = await getCurrentWebview().onDragDropEvent((event) => {
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
                            const dropPaths = event.payload.paths;
                            if (Array.isArray(dropPaths)) {
                                addFilesFromPaths(dropPaths);
                            }
                            break;
                    }
                });
            } catch (err) {
                console.error("Failed to setup drag drop listener:", err);
            }
        }
        setupListeners();

        return () => {
            if (unlistenDrop) unlistenDrop();
        };
    }, [isProcessing, addFilesFromPaths]);

    // --- HTML Fallback Dropzone ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (isProcessing) return;
        // The path property is injected by Electron/Tauri typically, but it requires coercion
        const paths = acceptedFiles.map(f => (f as File & { path?: string }).path).filter((p): p is string => Boolean(p));
        if (paths.length > 0) {
            addFilesFromPaths(paths);
        }
    }, [isProcessing, addFilesFromPaths]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        disabled: isProcessing,
        noDrag: true, // Let Tauri handle native drag events
        accept: {
            'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
            'image/*': ['.jpg', '.jpeg', '.png', '.webp']
        }
    });

    useEffect(() => {
        // Invalidate cached crops when tolerance changes
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.tolerance]);

    const removeFile = useCallback((id: string) => {
        if (isProcessing) return;
        setFiles(prev => prev.filter(f => f.id !== id));
    }, [isProcessing]);

    const handlePreview = async (file: MediaFile) => {
        if (isProcessing) return;
        setPreviewFile(file);
        setDetectedCrop(file.crop || null);

        if (!file.crop && file.path) {
            setDetectingCrop(true);
            try {
                const crop: CropArea = await invoke("detect_crop_areas", { filePath: file.path, tolerance: options.tolerance });
                setDetectedCrop(crop);
                // Cache detected crop in state to avoid re-calculating
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
    }, []);

    const handleProcessAll = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setProgressMsg("Inspecting requirements...");

        // Ensure all files have a crop generated before processing
        const itemsToProcess = [];
        for (const file of files) {
            let crop = file.crop;
            if (!crop) {
                try {
                    crop = await invoke<CropArea>("detect_crop_areas", { filePath: file.path, tolerance: options.tolerance });
                } catch {
                    // Fallback to purely dimensions bounds if detection wholly fails
                    crop = { w: 0, h: 0, x: 0, y: 0 };
                }
            }
            itemsToProcess.push({ path: file.path, crop });
        }

        setProgressMsg("Initializing processing engine...");

        let unlisten: () => void = () => { };
        try {
            unlisten = await listen<ProgressEventPayload>("crop-progress", (event) => {
                const percentage = (event.payload.current / event.payload.total) * 100;
                setProgress(Math.min(percentage, 100)); // Clamp at 100
                setProgressMsg(event.payload.message);
            });

            await invoke("process_files", { items: itemsToProcess, options });

            toast.success("Successfully processed all queued files", {
                duration: 5000,
                action: {
                    label: "Open Output",
                    onClick: () => invoke("open_output_folder")
                }
            });
            setFiles([]);
        } catch (error) {
            toast.error(`Processing pipeline aborted: ${String(error)}`);
        } finally {
            setIsProcessing(false);
            if (unlisten) unlisten();
        }
    };

    const hasFiles = files.length > 0;

    return (
        <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
            <Toaster theme="dark" position="bottom-right" className="font-sans" toastOptions={{
                className: "bg-zinc-900/90 backdrop-blur-xl border-zinc-800 text-zinc-100 shadow-2xl"
            }} />

            {/* Main Content Pane */}
            <main className="flex-1 flex flex-col relative h-full">
                {/* Application Header - Draggable Area */}
                <header data-tauri-drag-region className="h-[68px] flex items-center justify-between px-8 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md z-20 shrink-0 select-none">
                    <div className="flex items-center gap-3 pointer-events-none">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Settings size={16} className="text-white" />
                        </div>
                        <h1 className="text-sm font-semibold tracking-wide text-zinc-100">AutoCrop Pro</h1>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-hide">
                    {/* Primary Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`group relative w-full rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden border-2
                            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                            ${hasFiles ? 'h-32 bg-zinc-900/20 border-zinc-800/50 hover:border-indigo-500/30' : 'h-64 bg-zinc-900/40 border-dashed border-zinc-700/50 hover:border-indigo-500/50 hover:bg-zinc-900/60'}
                            ${isDragHovering ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-2xl shadow-indigo-500/20 z-10' : ''}
                        `}
                    >
                        <input {...getInputProps()} />

                        {/* Subtle interactive glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`p-4 rounded-2xl bg-zinc-800/50 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-300 shadow-xl
                                ${hasFiles ? 'scale-75 mb-0 p-3' : ''}`}>
                                <UploadCloud size={hasFiles ? 24 : 32} strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <p className={`font-medium text-zinc-200 transition-all duration-300 ${hasFiles ? 'text-sm' : 'text-lg'}`}>
                                    {isDragHovering ? "Release to queue automatically" : "Drag & drop media files here"}
                                </p>
                                {!hasFiles && (
                                    <p className="text-xs text-zinc-500 mt-2 font-medium">Alternatively, click to browse your computer directories</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pending Queue Grid */}
                    {hasFiles && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-medium text-zinc-400">
                                    Queue <span className="text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-full ml-2 text-xs">{files.length}</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {files.map((f, index) => (
                                    <div
                                        key={f.id}
                                        onClick={() => handlePreview(f)}
                                        className="group relative bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-zinc-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1 block"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {/* Visual Thumbnail Frame */}
                                        <div className="w-full h-32 bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                                            {f.previewUrl ? (
                                                f.type === 'video' ? (
                                                    <>
                                                        <video src={`${f.previewUrl}#t=0.1`} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" preload="metadata" />
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                                <Play size={14} className="text-white translate-x-0.5" fill="currentColor" />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <img src={f.previewUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt={f.name} />
                                                )
                                            ) : (
                                                <div className="text-zinc-700">
                                                    {f.type === 'video' ? <Video size={32} strokeWidth={1} /> : <ImageIcon size={32} strokeWidth={1} />}
                                                </div>
                                            )}

                                            {/* Queue Removal Action */}
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                                                    className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-red-200 flex items-center justify-center transition-colors"
                                                    title="Remove from queue"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            {/* Precalculation Status Badge */}
                                            {f.crop && (
                                                <div className="absolute bottom-2 left-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 text-emerald-400 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                                                    <CheckCircle2 size={12} /> Bounds Mapped
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta Information */}
                                        <div className="p-4">
                                            <p className="text-sm font-medium text-zinc-300 truncate group-hover:text-indigo-300 transition-colors" title={f.name}>
                                                {f.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                                                <span className="capitalize">{f.type} Record</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Persistent Right Toolbar: Configurations */}
            <aside className="w-80 border-l border-white/5 bg-zinc-950/80 backdrop-blur-2xl flex flex-col z-10 shrink-0 shadow-2xl relative">
                <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                        Export Settings
                        <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                    </h2>

                    <div className="space-y-8">
                        {/* Threshold Control */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                <Label className="text-sm font-medium text-zinc-300">Detection Tolerance</Label>
                                <div className="px-2 py-1 rounded-md bg-zinc-800 text-xs font-mono text-indigo-300">
                                    {options.tolerance}%
                                </div>
                            </div>
                            <div className="px-1">
                                <Slider
                                    value={[options.tolerance]}
                                    onValueChange={(val) => setOptions(o => ({ ...o, tolerance: val[0] }))}
                                    max={100}
                                    step={1}
                                    className="[&_[role=slider]]:bg-indigo-500 [&_[role=slider]]:border-4 [&_[role=slider]]:border-zinc-950 [&_[role=slider]]:shadow-xl [&>span]:bg-zinc-800 [&_[data-orientation=horizontal]>span]:bg-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Format Dropdown */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-zinc-300 pl-1">Target Encodings</Label>
                            <Select value={options.output_format} onValueChange={(val) => setOptions(o => ({ ...o, output_format: val }))}>
                                <SelectTrigger className="bg-zinc-900/50 border-white/5 text-zinc-300 h-12 rounded-xl focus:ring-1 focus:ring-indigo-500/50 transition-all">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 rounded-xl shadow-2xl">
                                    <SelectItem value="Same as source" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">Original Structure</SelectItem>
                                    <SelectItem value="mp4" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">H.264 (MP4)</SelectItem>
                                    <SelectItem value="png" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">Lossless Image (PNG)</SelectItem>
                                    <SelectItem value="jpg" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">Compressed (JPG)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Modifier Overrides */}
                        <div className="space-y-2 bg-zinc-900/30 rounded-2xl border border-white/5 p-2 relative">
                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">Apply Safety Margin</span>
                                    <p className="text-[10px] text-zinc-500">Adds 10px buffer around bound edge</p>
                                </div>
                                <Switch
                                    checked={options.padding}
                                    onCheckedChange={(c) => setOptions(o => ({ ...o, padding: c }))}
                                    className="data-[state=checked]:bg-indigo-500"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-red-500/5 transition-colors cursor-pointer group">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-red-400 transition-colors">Destructive Mode</span>
                                    <p className="text-[10px] text-zinc-500 text-red-500/70">Deletes original media when finished</p>
                                </div>
                                <Switch
                                    checked={options.delete_original}
                                    onCheckedChange={(c) => setOptions(o => ({ ...o, delete_original: c }))}
                                    className="data-[state=checked]:bg-red-500"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Primary Action Button Base */}
                <div className="p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent sticky bottom-0">
                    <button
                        disabled={!hasFiles || isProcessing}
                        onClick={handleProcessAll}
                        className="group relative w-full h-14 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-900 font-semibold rounded-2xl transition-all duration-300 overflow-hidden shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)] disabled:shadow-none"
                    >
                        {isProcessing && (
                            <div className="absolute inset-0 bg-indigo-500/10">
                                <div className="h-full bg-indigo-500/20 absolute left-0 top-0 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                            </div>
                        )}

                        <div className="relative flex items-center gap-2">
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-zinc-900/30 border-t-zinc-900 animate-spin" />
                                    <span>{progressMsg || "Processing..."} {Math.round(progress)}%</span>
                                </>
                            ) : (
                                <>
                                    <span>Start Engine Setup</span>
                                    {files.length > 0 && (
                                        <span className="bg-zinc-900/10 px-2 py-0.5 rounded-lg text-xs ml-1 font-bold">{files.length}</span>
                                    )}
                                    <ChevronRight size={18} className="text-zinc-400 group-hover:text-zinc-900 transition-colors group-hover:translate-x-1 duration-300" />
                                </>
                            )}
                        </div>
                    </button>
                    {!hasFiles && !isProcessing && (
                        <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest font-medium">No queue detected</p>
                    )}
                </div>
            </aside>

            {/* Diagnostic Visualization Overlay */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && closePreview()}>
                <DialogContent className="sm:max-w-5xl bg-zinc-950/80 backdrop-blur-3xl border-white/10 text-zinc-100 p-0 overflow-hidden shadow-2xl sm:rounded-3xl">
                    <DialogHeader className="p-4 px-6 absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                        <DialogTitle className="text-base font-medium truncate drop-shadow-md text-white">{previewFile?.name}</DialogTitle>
                        <DialogDescription className="text-zinc-300/80 text-xs drop-shadow">
                            {detectingCrop ? "Computing bounds matrices..." : "Dimensional projection overlay"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative w-full aspect-video bg-black/50 flex items-center justify-center p-0">
                        {previewFile?.previewUrl && (
                            <div className="relative inline-flex items-center justify-center w-full h-full max-h-[75vh]">
                                {previewFile?.type === 'video' ? (
                                    <video src={previewFile.previewUrl} className="max-w-full max-h-[75vh] object-contain" autoPlay muted loop />
                                ) : (
                                    <img src={previewFile.previewUrl} className="max-w-full max-h-[75vh] object-contain drop-shadow-2xl" alt="Preview Projection" />
                                )}

                                {/* Highlight Region Visualizer */}
                                {detectedCrop && detectedCrop.w > 0 && (
                                    <div
                                        className="absolute inset-[10%] border border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 pointer-events-none transition-all duration-500 ease-out rounded-lg mix-blend-screen"
                                        style={{
                                            left: "15%",
                                            top: "15%",
                                            width: "70%",
                                            height: "70%",
                                        }}
                                    >
                                        <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-indigo-400" />
                                        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-indigo-400" />
                                        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-indigo-400" />
                                        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-indigo-400" />
                                    </div>
                                )}

                                {/* Analysis Loading State */}
                                {detectingCrop && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-xl">
                                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                        <p className="text-sm font-medium text-zinc-300 animate-pulse">Running Vision Engine...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
