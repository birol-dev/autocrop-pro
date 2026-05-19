import { Grid3X3, FolderOpen, Image as ImageIcon, ChevronLeft, Play, Maximize2 } from "lucide-react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OutputFile } from "@/App";

type GalleryModalProps = {
    showGallery: boolean;
    closeGallery: () => void;
    galleryFiles: OutputFile[];
    galleryLoading: boolean;
    lightboxIndex: number | null;
    setLightboxIndex: React.Dispatch<React.SetStateAction<number | null>>;
};

export default function GalleryModal({
    showGallery,
    closeGallery,
    galleryFiles,
    galleryLoading,
    lightboxIndex,
    setLightboxIndex,
}: GalleryModalProps) {
    return (
        <Dialog open={showGallery} onOpenChange={(open) => !open && closeGallery()}>
            <DialogContent className="sm:max-w-6xl max-h-[90vh] bg-zinc-950/95 backdrop-blur-3xl border-white/10 text-zinc-100 p-0 overflow-hidden shadow-2xl sm:rounded-3xl flex flex-col">
                <DialogHeader className="p-5 px-6 border-b border-white/5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Grid3X3 size={14} className="text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold text-white">Output Gallery</DialogTitle>
                                <DialogDescription className="text-zinc-400 text-xs mt-0.5">
                                    {galleryFiles.length} processed file{galleryFiles.length !== 1 ? 's' : ''} in AutoCrop_Output
                                </DialogDescription>
                            </div>
                        </div>
                        <button
                            onClick={() => invoke("open_output_folder")}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 text-xs text-zinc-300 hover:text-white transition-all"
                        >
                            <FolderOpen size={14} />
                            Open in Explorer
                        </button>
                    </div>
                </DialogHeader>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {galleryLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-sm text-zinc-400">Loading gallery...</p>
                        </div>
                    ) : galleryFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                            <ImageIcon size={48} strokeWidth={1} className="mb-4" />
                            <p className="text-sm">No output files found</p>
                        </div>
                    ) : lightboxIndex !== null ? (
                        /* ── Lightbox View ── */
                        <div className="relative flex flex-col items-center">
                            {/* Navigation bar */}
                            <div className="flex items-center justify-between w-full mb-4">
                                <button
                                    onClick={() => setLightboxIndex(null)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 text-xs text-zinc-300 hover:text-white transition-all"
                                >
                                    <ChevronLeft size={14} />
                                    Back to Grid
                                </button>
                                <p className="text-xs text-zinc-500 font-mono">
                                    {lightboxIndex + 1} / {galleryFiles.length}
                                </p>
                                <p className="text-sm text-zinc-300 font-medium truncate max-w-[200px]" title={galleryFiles[lightboxIndex].name}>
                                    {galleryFiles[lightboxIndex].name}
                                </p>
                            </div>

                            {/* Image/Video */}
                            <div className="w-full flex items-center justify-center rounded-2xl bg-black/30 border border-white/5 overflow-hidden" style={{ minHeight: '400px' }}>
                                {galleryFiles[lightboxIndex].file_type === 'video' ? (
                                    <video
                                        src={convertFileSrc(galleryFiles[lightboxIndex].path)}
                                        className="max-w-full max-h-[60vh] object-contain"
                                        controls autoPlay muted
                                        onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <img
                                        src={convertFileSrc(galleryFiles[lightboxIndex].path)}
                                        className="max-w-full max-h-[60vh] object-contain"
                                        alt={galleryFiles[lightboxIndex].name}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                            </div>

                            {/* Prev/Next buttons */}
                            <div className="flex items-center gap-3 mt-4">
                                <button
                                    disabled={lightboxIndex <= 0}
                                    onClick={() => setLightboxIndex(i => i !== null ? Math.max(0, i - 1) : null)}
                                    className="px-4 py-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 text-sm text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                >
                                    ← Previous
                                </button>
                                <button
                                    disabled={lightboxIndex >= galleryFiles.length - 1}
                                    onClick={() => setLightboxIndex(i => i !== null ? Math.min(galleryFiles.length - 1, i + 1) : null)}
                                    className="px-4 py-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 text-sm text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── Grid View ── */
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {galleryFiles.map((file, idx) => (
                                <button
                                    key={file.path}
                                    onClick={() => setLightboxIndex(idx)}
                                    className="group relative rounded-2xl overflow-hidden bg-zinc-900/50 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    <div className="aspect-square w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
                                        {file.file_type === 'video' ? (
                                            <>
                                                <video
                                                    src={`${convertFileSrc(file.path)}#t=0.1`}
                                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                                    preload="metadata"
                                                    onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Play size={16} className="text-white translate-x-0.5" fill="currentColor" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <img
                                                src={convertFileSrc(file.path)}
                                                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                                alt={file.name}
                                                loading="lazy"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        )}
                                    </div>

                                    {/* Hover expand icon */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                            <Maximize2 size={12} className="text-white" />
                                        </div>
                                    </div>

                                    {/* Filename */}
                                    <div className="p-3 bg-zinc-900/80">
                                        <p className="text-xs text-zinc-400 truncate group-hover:text-emerald-300 transition-colors" title={file.name}>
                                            {file.name}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
