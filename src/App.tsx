import React, { useState, useCallback, useEffect } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Settings, Image as ImageIcon, Video, Trash2, FolderOpen, Play, CheckCircle2, ChevronDown, Check, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Toaster, toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export type CropArea = {
    w: number;
    h: number;
    x: number;
    y: number;
};

export type MediaFile = {
    id: string;
    file: File;
    name: string;
    path: string;
    size: number;
    type: "video" | "image";
    crop?: CropArea;
};

export default function App() {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState("");

    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [detectingCrop, setDetectingCrop] = useState(false);
    const [detectedCrop, setDetectedCrop] = useState<CropArea | null>(null);

    const [options, setOptions] = useState({
        tolerance: 20,
        output_format: "Same as source",
        padding: false,
        delete_original: false,
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (isProcessing) return;
        const newFiles: MediaFile[] = acceptedFiles.map((file: any) => {
            const isVideo = file.type.startsWith("video") || file.name.endsWith(".mp4") || file.name.endsWith(".mov");
            return {
                id: Math.random().toString(36).substring(7),
                file: file,
                name: file.name,
                path: file.path || file.name,
                size: file.size,
                type: isVideo ? "video" : "image"
            };
        });
        setFiles(prev => [...prev, ...newFiles]);
    }, [isProcessing]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled: isProcessing,
        accept: {
            'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
            'image/*': ['.jpg', '.jpeg', '.png']
        }
    });

    const removeFile = (id: string) => {
        if (isProcessing) return;
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handlePreview = async (file: MediaFile) => {
        if (isProcessing) return;
        setPreviewFile(file);
        const url = URL.createObjectURL(file.file);
        setPreviewUrl(url);
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
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    const handleProcessAll = async () => {
        if (files.length === 0) return;

        // Auto-detect crop for any missing ones before processing?
        // The backend wants the crop dimension passed for each item in Tauri 
        const items = [];
        setIsProcessing(true);
        setProgress(0);
        setProgressMsg("Checking crop dimensions...");

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

        setProgressMsg("Starting processing...");

        const unlisten = await listen<{ current: number; total: number; message: string }>("crop-progress", (event) => {
            setProgress((event.payload.current / event.payload.total) * 100);
            setProgressMsg(event.payload.message);
        });

        try {
            await invoke("process_files", { items, options });
            toast.success("Successfully processed all files!", {
                action: {
                    label: "Open Output Folder",
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
        <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
            <Toaster theme="dark" position="top-center" />

            {/* Sidebar: Advanced Options */}
            <aside className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col z-10 shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Settings size={18} className="text-white" />
                        </div>
                        AutoCrop Pro
                    </h1>
                    <p className="text-xs text-slate-400 mt-2">Intelligent media cropping</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-6">Advanced Options</h2>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-slate-300">Crop Tolerance</Label>
                                    <span className="text-xs text-indigo-400">{options.tolerance}%</span>
                                </div>
                                <Slider
                                    value={[options.tolerance]}
                                    onValueChange={(val) => setOptions(o => ({ ...o, tolerance: val[0] }))}
                                    max={100}
                                    step={1}
                                    className="[&_[role=slider]]:bg-indigo-500"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-300">Output Format</Label>
                                <Select value={options.output_format} onValueChange={(val) => setOptions(o => ({ ...o, output_format: val }))}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 h-10">
                                        <SelectValue placeholder="Format" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                        <SelectItem value="Same as source">Same as source</SelectItem>
                                        <SelectItem value="mp4">MP4 Video</SelectItem>
                                        <SelectItem value="png">PNG Image</SelectItem>
                                        <SelectItem value="jpg">JPG Image</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <Checkbox
                                    id="padding"
                                    checked={options.padding}
                                    onCheckedChange={(c) => setOptions(o => ({ ...o, padding: c as boolean }))}
                                    className="border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                                <Label htmlFor="padding" className="text-slate-300 leading-none">Add margin/padding</Label>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Label htmlFor="delete-orig" className="text-slate-300">Delete original</Label>
                                <Switch
                                    id="delete-orig"
                                    checked={options.delete_original}
                                    onCheckedChange={(c) => setOptions(o => ({ ...o, delete_original: c }))}
                                    className="data-[state=checked]:bg-red-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                    <button
                        disabled={!hasFiles || isProcessing}
                        onClick={handleProcessAll}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/20"
                    >
                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-1 w-full">
                                <div className="text-xs animate-pulse">Processing... {Math.round(progress)}%</div>
                                <div className="w-full bg-indigo-900/50 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-white h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        ) : (
                            <>
                                <Play size={18} fill="currentColor" />
                                Process All {files.length > 0 && `(${files.length})`}
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content: Dropzone & File List */}
            <main className="flex-1 flex flex-col relative h-full">
                <div className="flex-1 p-8 overflow-y-auto space-y-8 pb-32">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200
              ${isDragActive
                                ? 'border-indigo-400 bg-indigo-900/20 text-indigo-300'
                                : 'border-indigo-500/30 bg-indigo-950/10 text-slate-400 hover:bg-indigo-950/20 hover:border-indigo-500/50'
                            }
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <FolderOpen size={48} className={`mb-4 ${isDragActive ? 'text-indigo-400' : 'text-indigo-400/80'}`} />
                        <p className="text-lg font-medium text-slate-200">
                            {isDragActive ? "Drop files now..." : "Drag & drop media files here"}
                        </p>
                        <p className="text-sm mt-1">or click to browse (.mp4, .mov, .jpg, .png)</p>
                    </div>

                    {/* File List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Selected Files</h2>
                            <span className="text-sm text-slate-400">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
                        </div>

                        {hasFiles ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                                {files.map(f => (
                                    <div
                                        key={f.id}
                                        onClick={() => handlePreview(f)}
                                        className={`p-4 rounded-xl border border-slate-800 flex items-center gap-4 group transition-colors cursor-pointer
                      ${isProcessing ? 'bg-slate-900/30 opacity-60' : 'bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-700'}`}
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-indigo-900/30 flex items-center justify-center shrink-0">
                                            {f.type === 'video' ? (
                                                <Video size={20} className="text-indigo-400" />
                                            ) : (
                                                <ImageIcon size={20} className="text-indigo-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-slate-200" title={f.name}>{f.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-slate-500">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                {f.crop && (
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Scanned</span>
                                                )}
                                            </div>
                                        </div>
                                        {!isProcessing && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                                                className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors p-2 rounded-lg opacity-0 group-hover:opacity-100"
                                                title="Remove file"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500 border border-transparent">
                                No files selected yet. Drop some above!
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Preview Modal */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && closePreview()}>
                <DialogContent className="sm:max-w-4xl bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-lg font-medium truncate pr-8">{previewFile?.name}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {detectingCrop ? "Analyzing black bars..." : "Crop preview overlay shown below"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative w-full aspect-video bg-black flex items-center justify-center p-6 border-t border-slate-800">
                        {previewUrl && (
                            <div className="relative inline-block max-w-full max-h-full">
                                {previewFile?.type === 'video' ? (
                                    <video src={previewUrl} className="max-w-full max-h-[60vh] object-contain" controls />
                                ) : (
                                    <img src={previewUrl} className="max-w-full max-h-[60vh] object-contain" alt="Preview" />
                                )}

                                {/* Crop Bounding Box Overlay */}
                                {detectedCrop && detectedCrop.w > 0 && (
                                    <div
                                        className="absolute border-2 border-indigo-500 bg-indigo-500/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-10 pointer-events-none transition-all duration-300"
                                        style={{
                                            // Note: For a perfectly accurate preview box in web, 
                                            // we would need the natural dimensions of the media to scale `x, y, w, h` properly
                                            // Since we don't have natural dimensions computed synchronously, 
                                            // this is a simplified visual representation.
                                            left: "5%",
                                            top: "5%",
                                            width: "90%",
                                            height: "90%",
                                        }}
                                    >
                                        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded font-mono font-medium">
                                            CROP DETECTED
                                        </div>
                                    </div>
                                )}
                                {detectingCrop && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-20">
                                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
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
