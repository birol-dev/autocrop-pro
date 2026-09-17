import { useState, useEffect } from "react";
import { Image as ImageIcon, X } from "lucide-react";
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
    const [mediaDim, setMediaDim] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
        setMediaDim(null);
    }, [previewFile?.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePreview();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closePreview]);

    if (!previewFile) return null;

    const hasCrop = detectedCrop && detectedCrop.w > 0 && detectedCrop.h > 0 && mediaDim && mediaDim.w > 0;
    const cropLeft = hasCrop ? (detectedCrop.x / mediaDim.w) * 100 : 0;
    const cropTop = hasCrop ? (detectedCrop.y / mediaDim.h) * 100 : 0;
    const cropW = hasCrop ? (detectedCrop.w / mediaDim.w) * 100 : 0;
    const cropH = hasCrop ? (detectedCrop.h / mediaDim.h) * 100 : 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
            onClick={closePreview}
        >
            <div
                className="relative max-w-5xl w-full flex flex-col overflow-hidden"
                style={{
                    border: "var(--border-w) solid var(--border)",
                    borderRadius: "20px",
                    background: "var(--surface)",
                    boxShadow: "var(--shadow-lg)",
                    maxHeight: "90vh",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 shrink-0"
                    style={{ borderBottom: "var(--border-w) solid var(--border)", background: "var(--surface)" }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <p
                            className="truncate"
                            style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontWeight: 800,
                                fontSize: "1rem",
                                color: "var(--text)",
                                margin: 0,
                            }}
                            title={previewFile.name}
                        >
                            {previewFile.name}
                        </p>
                        <span
                            style={{
                                background: detectingCrop ? "var(--purple)" : detectedCrop ? "var(--teal)" : "var(--bg-card)",
                                color: detectingCrop || detectedCrop ? "#fff" : "var(--text-muted)",
                                border: "1.5px solid var(--border)",
                                borderRadius: "8px",
                                padding: "2px 8px",
                                fontSize: "0.72rem",
                                fontFamily: "'Nunito', sans-serif",
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {detectingCrop
                                ? "Detecting crop…"
                                : detectedCrop && detectedCrop.w > 0
                                ? `${detectedCrop.w}×${detectedCrop.h} at (${detectedCrop.x}, ${detectedCrop.y})`
                                : "No crop detected"}
                        </span>
                    </div>

                    <button
                        onClick={closePreview}
                        style={{
                            width: "32px",
                            height: "32px",
                            border: "2px solid var(--border)",
                            borderRadius: "10px",
                            background: "var(--pink)",
                            color: "#fff",
                            cursor: "pointer",
                            boxShadow: "2px 2px 0 var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        title="Close (Esc)"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Media Preview viewport */}
                <div
                    className="flex-1 flex items-center justify-center p-6 overflow-hidden"
                    style={{ background: "var(--bg-card)", minHeight: "360px" }}
                >
                    {previewFile.previewUrl ? (
                        <div className="relative inline-flex items-center justify-center max-w-full max-h-[70vh]">
                            {previewFile.type === "video" ? (
                                <video
                                    src={previewFile.previewUrl}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                    autoPlay
                                    muted
                                    loop
                                    onLoadedMetadata={(e) => {
                                        setMediaDim({
                                            w: e.currentTarget.videoWidth,
                                            h: e.currentTarget.videoHeight,
                                        });
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLVideoElement).style.display = "none";
                                    }}
                                />
                            ) : (
                                <img
                                    src={previewFile.previewUrl}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                                    alt={previewFile.name}
                                    onLoad={(e) => {
                                        setMediaDim({
                                            w: e.currentTarget.naturalWidth,
                                            h: e.currentTarget.naturalHeight,
                                        });
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                />
                            )}

                            {/* Dynamic Crop overlay accurately sized to detected bounds */}
                            {hasCrop && (
                                <div
                                    className="absolute pointer-events-none transition-all duration-300"
                                    style={{
                                        left: `${cropLeft}%`,
                                        top: `${cropTop}%`,
                                        width: `${cropW}%`,
                                        height: `${cropH}%`,
                                        border: "2px dashed var(--teal)",
                                        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(255,255,255,0.4)",
                                    }}
                                >
                                    <div className="absolute top-1 left-1 bg-black/70 text-white font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/20">
                                        {detectedCrop.w}×{detectedCrop.h}
                                    </div>
                                </div>
                            )}

                            {/* Loading overlay */}
                            {detectingCrop && (
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
                                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                                >
                                    <div
                                        className="animate-spin mb-3"
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            border: "3px solid var(--border)",
                                            borderTopColor: "var(--teal)",
                                        }}
                                    />
                                    <p style={{ color: "#fff", fontSize: "0.85rem", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
                                        Detecting crop area…
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-zinc-500">
                            <ImageIcon size={48} strokeWidth={1} />
                            <p style={{ fontSize: "0.85rem" }}>Preview unavailable</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
