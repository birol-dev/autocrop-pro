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
    previewUrl?: string; // Add previewUrl directly to state
};

export default function App() {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState("");

    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
    const [detectingCrop, setDetectingCrop] = useState(false);
    const [detectedCrop, setDetectedCrop] = useState<CropArea | null>(null);

    const [options, setOptions] = useState({
        tolerance: 20,
        output_format: "Same as source",
        padding: false,
        delete_original: false,
    });

    const addFilesFromPaths = async (paths: string[]) => {
        const newFiles: MediaFile[] = [];
        for (const path of paths) {
            // Very naive check for type; can be expanded
            const isVideo = path.toLowerCase().endsWith(".mp4") || path.toLowerCase().endsWith(".mov") || path.toLowerCase().endsWith(".avi") || path.toLowerCase().endsWith(".mkv");
            const isImage = path.toLowerCase().endsWith(".png") || path.toLowerCase().endsWith(".jpg") || path.toLowerCase().endsWith(".jpeg") || path.toLowerCase().endsWith(".webp");

            if (!isVideo && !isImage) continue;

            const name = path.split('\\').pop()?.split('/').pop() || path;
            const previewUrl = convertFileSrc(path);

            newFiles.push({
                id: Math.random().toString(36).substring(7),
                path,
                name,
                type: isVideo ? "video" : "image",
                previewUrl
            });
        }

        if (newFiles.length > 0) {
            setFiles(prev => {
                // filter out duplicates based on path
                const existingPaths = new Set(prev.map(f => f.path));
                const uniqueNew = newFiles.filter(f => !existingPaths.has(f.path));
                return [...prev, ...uniqueNew];
            });
        }
    };

    // Listen for Tauri native drag and drop
    const [isDragHovering, setIsDragHovering] = useState(false);

    useEffect(() => {
        let unlistenDrop: () => void;

        async function setupListeners() {
            unlistenDrop = await getCurrentWebview().onDragDropEvent((event) => {
                if (isProcessing) return;

                if (event.payload.type === 'over' || event.payload.type === 'enter') {
                    setIsDragHovering(true);
                } else if (event.payload.type === 'leave') {
                    setIsDragHovering(false);
                } else if (event.payload.type === 'drop') {
                    setIsDragHovering(false);
                    const dropPaths = event.payload.paths;
                    if (Array.isArray(dropPaths)) {
                        addFilesFromPaths(dropPaths);
                    }
                }
            });
        }
        setupListeners();

        return () => {
            if (unlistenDrop) unlistenDrop();
        };
    }, [isProcessing]);

    // Fallback for HTML input clicking
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (isProcessing) return;
        const paths = acceptedFiles.map(f => (f as any).path).filter(Boolean);
        if (paths.length > 0) {
            addFilesFromPaths(paths);
        }
    }, [isProcessing]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        disabled: isProcessing,
        noDrag: true, // Disable HTML5 drag-and-drop to let Tauri handle it native-side
        accept: {
            'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
            'image/*': ['.jpg', '.jpeg', '.png', '.webp']
        }
    });

    const removeFile = (id: string) => {
        if (isProcessing) return;
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handlePreview = async (file: MediaFile) => {
        if (isProcessing) return;
        setPreviewFile(file);
        setDetectedCrop(file.crop || null);

        if (!file.crop && file.path) {
            setDetectingCrop(true);
            try {
                const crop: CropArea = await invoke("detect_crop_areas", { filePath: file.path });
                setDetectedCrop(crop);
                // Cache it in state
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, crop } : f));
            } catch (e: any) {
                toast.error(`Detection failed: ${e}`);
            } finally {
                setDetectingCrop(false);
            }
        }
    };

    const closePreview = () => {
        setPreviewFile(null);
    };

    const handleProcessAll = async () => {
        if (files.length === 0) return;

        const items = [];
        setIsProcessing(true);
        setProgress(0);
        setProgressMsg("Preparing files...");

        for (const file of files) {
            let crop = file.crop;
            if (!crop) {
                try {
                    crop = await invoke("detect_crop_areas", { filePath: file.path });
                } catch (e) {
                    crop = { w: 0, h: 0, x: 0, y: 0 }; // Fallback
                }
            }
            items.push({ path: file.path, crop });
        }

        setProgressMsg("Processing started...");

        const unlisten = await listen<{ current: number; total: number; message: string }>("crop-progress", (event) => {
            setProgress((event.payload.current / event.payload.total) * 100);
            setProgressMsg(event.payload.message);
        });

        try {
            await invoke("process_files", { items, options });
            toast.success("Successfully processed all files!", {
                duration: 5000,
                action: {
                    label: "Open Folder",
                    onClick: () => invoke("open_output_folder")
                }
            });
            setFiles([]); // Clear list on success
        } catch (e: any) {
            toast.error(`Processing failed: ${e}`);
        } finally {
            setIsProcessing(false);
            unlisten();
        }
    };

    const hasFiles = files.length > 0;

    return (
        <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
            <Toaster theme="dark" position="bottom-right" className="font-sans" toastOptions={{
                className: "bg-zinc-900/90 backdrop-blur-xl border-zinc-800 text-zinc-100"
            }} />

            {/* Main Content: File List & Dropzone */}
            <main className="flex-1 flex flex-col relative h-full">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md z-20">
                    <div className="flex items-center gap-3 select-none tauri-drag-region">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Settings size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold tracking-wide text-zinc-100">AutoCrop Pro</h1>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto pb-32 space-y-8 scrollbar-hide">
                    {/* Hero Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`group relative w-full rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden border-2
                            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                            ${hasFiles ? 'h-32 bg-zinc-900/20 border-zinc-800/50 hover:border-indigo-500/30' : 'h-64 bg-zinc-900/40 border-dashed border-zinc-700/50 hover:border-indigo-500/50 hover:bg-zinc-900/60'}
                            ${isDragHovering ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-2xl shadow-indigo-500/20 z-50' : ''}
                        `}
                    >
                        <input {...getInputProps()} />

                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`p-4 rounded-2xl bg-zinc-800/50 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-300 shadow-xl
                                ${hasFiles ? 'scale-75 mb-0' : ''}`}>
                                <UploadCloud size={hasFiles ? 24 : 32} strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <p className={`font-medium text-zinc-200 transition-all duration-300 ${hasFiles ? 'text-sm' : 'text-lg'}`}>
                                    Drag & drop media files here
                                </p>
                                {!hasFiles && (
                                    <p className="text-xs text-zinc-500 mt-2 font-medium">Or click to browse your computer</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* File Grid */}
                    {hasFiles && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-medium text-zinc-400">Queue <span className="text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-full ml-2 text-xs">{files.length}</span></h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {files.map((f, index) => (
                                    <div
                                        key={f.id}
                                        onClick={() => handlePreview(f)}
                                        className="group relative bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-zinc-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1 block"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {/* Preview Thumbnail */}
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

                                            {/* Top right gradient mask for delete button */}
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                                                    className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-red-200 flex items-center justify-center transition-colors"
                                                    title="Remove file"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            {/* Detected Badge */}
                                            {f.crop && (
                                                <div className="absolute bottom-2 left-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 text-emerald-400 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                                                    <CheckCircle2 size={12} /> Ready
                                                </div>
                                            )}
                                        </div>

                                        {/* File Info */}
                                        <div className="p-4">
                                            <p className="text-sm font-medium text-zinc-300 truncate group-hover:text-indigo-300 transition-colors" title={f.name}>
                                                {f.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                                                <span className="capitalize">{f.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Right Sidebar: Settings & Actions */}
            <aside className="w-80 border-l border-white/5 bg-zinc-950/80 backdrop-blur-2xl flex flex-col z-10 shrink-0 shadow-2xl relative">
                <div className="p-6">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                        Configuration
                        <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                    </h2>

                    <div className="space-y-8">
                        {/* Tolerance */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                <Label className="text-sm font-medium text-zinc-300">Tolerance</Label>
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

                        {/* Format */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-zinc-300 pl-1">Export Format</Label>
                            <Select value={options.output_format} onValueChange={(val) => setOptions(o => ({ ...o, output_format: val }))}>
                                <SelectTrigger className="bg-zinc-900/50 border-white/5 text-zinc-300 h-12 rounded-xl focus:ring-1 focus:ring-indigo-500/50 transition-all">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 rounded-xl shadow-2xl">
                                    <SelectItem value="Same as source" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">Original Format</SelectItem>
                                    <SelectItem value="mp4" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">MP4 Video</SelectItem>
                                    <SelectItem value="png" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">PNG Image</SelectItem>
                                    <SelectItem value="jpg" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">JPG Image</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2 bg-zinc-900/30 rounded-2xl border border-white/5 p-2">
                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">Add Padding</span>
                                    <p className="text-[10px] text-zinc-500">Add safe margin around crop</p>
                                </div>
                                <Switch
                                    checked={options.padding}
                                    onCheckedChange={(c) => setOptions(o => ({ ...o, padding: c }))}
                                    className="data-[state=checked]:bg-indigo-500"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-red-500/5 transition-colors cursor-pointer group">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-red-300 transition-colors">Replace Original</span>
                                    <p className="text-[10px] text-zinc-500">Overwrites source file</p>
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

                <div className="mt-auto p-6 bg-gradient-to-t from-zinc-950 to-transparent">
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
                                    <span>Start Processing</span>
                                    {files.length > 0 && (
                                        <span className="bg-zinc-900/10 px-2 py-0.5 rounded-lg text-xs ml-1">{files.length}</span>
                                    )}
                                    <ChevronRight size={18} className="text-zinc-400 group-hover:text-zinc-900 transition-colors group-hover:translate-x-1 duration-300" />
                                </>
                            )}
                        </div>
                    </button>
                    {!hasFiles && !isProcessing && (
                        <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest font-medium">Ready</p>
                    )}
                </div>
            </aside>

            {/* Modern Preview Modal */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && closePreview()}>
                <DialogContent className="sm:max-w-5xl bg-zinc-950/80 backdrop-blur-2xl border-white/10 text-zinc-100 p-0 overflow-hidden shadow-2xl sm:rounded-3xl">
                    <DialogHeader className="p-4 px-6 absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                        <DialogTitle className="text-base font-medium truncate drop-shadow-md text-white">{previewFile?.name}</DialogTitle>
                        <DialogDescription className="text-zinc-300/80 text-xs drop-shadow">
                            {detectingCrop ? "Analyzing content bounds..." : "Crop preview overlay"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative w-full aspect-video bg-black/50 flex items-center justify-center p-0">
                        {previewFile?.previewUrl && (
                            <div className="relative inline-flex items-center justify-center w-full h-full max-h-[75vh]">
                                {previewFile?.type === 'video' ? (
                                    <video src={previewFile.previewUrl} className="max-w-full max-h-[75vh] object-contain" autoPlay muted loop />
                                ) : (
                                    <img src={previewFile.previewUrl} className="max-w-full max-h-[75vh] object-contain drop-shadow-2xl" alt="Preview" />
                                )}

                                {/* Abstract Representation of Detected Crop */}
                                {detectedCrop && detectedCrop.w > 0 && (
                                    <div
                                        className="absolute inset-[10%] border border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 pointer-events-none transition-all duration-500 ease-out rounded-lg mix-blend-screen"
                                        style={{
                                            // In a perfect world, we calculate exact box coordinates using naturalWidth scaled to display size.
                                            // For safety and aesthetics, we overlay a generic stylized crop box.
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

                                        {/* <div className="absolute top-3 left-3 bg-indigo-500/80 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                            <CheckCircle2 size={10} /> DETECTED
                                        </div> */}
                                    </div>
                                )}

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
