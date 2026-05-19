import { Play, Trash2, CheckCircle2, Video, Image as ImageIcon } from "lucide-react";
import { MediaFile } from "@/App";

type FileQueueProps = {
    files: MediaFile[];
    onPreviewFile: (file: MediaFile) => void;
    onRemoveFile: (id: string) => void;
};

export default function FileQueue({
    files,
    onPreviewFile,
    onRemoveFile,
}: FileQueueProps) {
    return (
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
                        onClick={() => onPreviewFile(f)}
                        className="group relative bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-zinc-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Thumbnail */}
                        <div className="w-full h-32 bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                            {f.previewUrl ? (
                                f.type === 'video' ? (
                                    <>
                                        <video
                                            src={`${f.previewUrl}#t=0.1`}
                                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                            preload="metadata"
                                            onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                <Play size={14} className="text-white translate-x-0.5" fill="currentColor" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={f.previewUrl}
                                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                        alt={f.name}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )
                            ) : (
                                <div className="text-zinc-700">
                                    {f.type === 'video' ? <Video size={32} strokeWidth={1} /> : <ImageIcon size={32} strokeWidth={1} />}
                                </div>
                            )}

                            {/* Remove button */}
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveFile(f.id); }}
                                    className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-red-200 flex items-center justify-center transition-colors"
                                    title="Remove from queue"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Crop badge */}
                            {f.crop && (
                                <div className="absolute bottom-2 left-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 text-emerald-400 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                                    <CheckCircle2 size={12} /> Crop Ready
                                </div>
                            )}
                        </div>

                        {/* File info */}
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
    );
}
