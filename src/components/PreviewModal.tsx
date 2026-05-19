import { Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MediaFile, CropArea } from "@/App";

type PreviewModalProps = {
    previewFile: MediaFile | null;
    closePreview: () => void;
    detectingCrop: boolean;
    detectedCrop: CropArea | null;
};

export default function PreviewModal({
    previewFile,
    closePreview,
    detectingCrop,
    detectedCrop,
}: PreviewModalProps) {
    return (
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && closePreview()}>
            <DialogContent className="sm:max-w-5xl bg-zinc-950/80 backdrop-blur-3xl border-white/10 text-zinc-100 p-0 overflow-hidden shadow-2xl sm:rounded-3xl">
                <DialogHeader className="p-4 px-6 absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <DialogTitle className="text-base font-medium truncate drop-shadow-md text-white">{previewFile?.name}</DialogTitle>
                    <DialogDescription className="text-zinc-300/80 text-xs drop-shadow">
                        {detectingCrop ? "Detecting crop boundaries..." : detectedCrop ? `Crop: ${detectedCrop.w}×${detectedCrop.h} at (${detectedCrop.x}, ${detectedCrop.y})` : "Click to detect crop area"}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative w-full aspect-video bg-black/50 flex items-center justify-center p-0">
                    {previewFile?.previewUrl ? (
                        <div className="relative inline-flex items-center justify-center w-full h-full max-h-[75vh]">
                            {previewFile.type === 'video' ? (
                                <video
                                    src={previewFile.previewUrl}
                                    className="max-w-full max-h-[75vh] object-contain"
                                    autoPlay muted loop
                                    onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                                />
                            ) : (
                                <img
                                    src={previewFile.previewUrl}
                                    className="max-w-full max-h-[75vh] object-contain drop-shadow-2xl"
                                    alt="Preview"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}

                            {/* Crop overlay — hardcoded for visual indication */}
                            {detectedCrop && detectedCrop.w > 0 && (
                                <div
                                    className="absolute border-2 border-indigo-400/60 bg-indigo-500/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-10 pointer-events-none transition-all duration-500 ease-out rounded"
                                    style={{
                                        left: "10%",
                                        top: "10%",
                                        width: "80%",
                                        height: "80%",
                                    }}
                                >
                                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                                </div>
                            )}

                            {/* Loading overlay */}
                            {detectingCrop && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-xl">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-300 animate-pulse">Detecting crop area...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-zinc-600 flex flex-col items-center gap-3">
                            <ImageIcon size={48} strokeWidth={1} />
                            <p className="text-sm">Preview unavailable</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
