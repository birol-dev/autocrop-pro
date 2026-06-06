import { Play, Trash2, CheckCircle2, Video, Image as ImageIcon } from "lucide-react";
import { MediaFile } from "@/App";

type FileQueueProps = {
    files: MediaFile[];
    onPreviewFile: (file: MediaFile) => void;
    onRemoveFile: (id: string) => void;
};

export default function FileQueue({ files, onPreviewFile, onRemoveFile }: FileQueueProps) {
    return (
        <div className="flex flex-col gap-4 pb-16">
            {/* Queue header */}
            <div className="flex items-center gap-3">
                <h2
                    style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: "var(--text)",
                        margin: 0,
                    }}
                >
                    Queue
                </h2>
                <span
                    style={{
                        background: "var(--teal)",
                        border: "2px solid var(--border)",
                        borderRadius: "8px",
                        padding: "1px 10px",
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800,
                        fontSize: "0.78rem",
                        color: "#fff",
                        boxShadow: "2px 2px 0px var(--border)",
                    }}
                >
                    {files.length}
                </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((f, index) => (
                    <div
                        key={f.id}
                        onClick={() => onPreviewFile(f)}
                        className="group relative cursor-pointer overflow-hidden transition-all duration-200"
                        style={{
                            border: "var(--border-w) solid var(--border)",
                            borderRadius: "var(--radius-lg)",
                            background: "var(--surface)",
                            boxShadow: "var(--shadow)",
                            animationDelay: `${index * 50}ms`,
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px, -2px)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = "translate(0, 0)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow)";
                        }}
                    >
                        {/* Thumbnail */}
                        <div
                            className="w-full relative overflow-hidden flex items-center justify-center"
                            style={{
                                height: "120px",
                                borderBottom: "var(--border-w) solid var(--border)",
                                background: "var(--bg-card)",
                            }}
                        >
                            {f.previewUrl ? (
                                f.type === "video" ? (
                                    <>
                                        <video
                                            src={`${f.previewUrl}#t=0.1`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            preload="metadata"
                                            onError={e => { (e.target as HTMLVideoElement).style.display = "none"; }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.3)" }}>
                                            <div
                                                className="flex items-center justify-center"
                                                style={{
                                                    width: "36px", height: "36px",
                                                    borderRadius: "50%",
                                                    background: "#fff",
                                                    border: "2px solid var(--border)",
                                                }}
                                            >
                                                <Play size={14} className="translate-x-0.5" fill="var(--text)" color="var(--text)" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={f.previewUrl}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={f.name}
                                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                )
                            ) : (
                                <div style={{ color: "var(--text-muted)" }}>
                                    {f.type === "video" ? <Video size={32} strokeWidth={1.5} /> : <ImageIcon size={32} strokeWidth={1.5} />}
                                </div>
                            )}

                            {/* Remove button */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={e => { e.stopPropagation(); onRemoveFile(f.id); }}
                                    className="flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    style={{
                                        width: "28px", height: "28px",
                                        borderRadius: "8px",
                                        border: "2px solid var(--border)",
                                        background: "var(--pink)",
                                        color: "#fff",
                                        boxShadow: "2px 2px 0px var(--border)",
                                        cursor: "pointer",
                                    }}
                                    title="Remove from queue"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            {/* Crop badge */}
                            {f.crop && (
                                <div
                                    className="absolute bottom-2 left-2 flex items-center gap-1"
                                    style={{
                                        background: "var(--teal)",
                                        border: "2px solid var(--border)",
                                        borderRadius: "8px",
                                        padding: "2px 8px",
                                        fontSize: "0.65rem",
                                        fontFamily: "'Nunito', sans-serif",
                                        fontWeight: 800,
                                        color: "#fff",
                                        boxShadow: "2px 2px 0px var(--border)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    <CheckCircle2 size={11} />
                                    Crop Ready
                                </div>
                            )}
                        </div>

                        {/* File info */}
                        <div className="p-3">
                            <p
                                className="truncate"
                                style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 600,
                                    fontSize: "0.82rem",
                                    color: "var(--text)",
                                    margin: 0,
                                }}
                                title={f.name}
                            >
                                {f.name}
                            </p>
                            <p
                                style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                    margin: "3px 0 0 0",
                                    textTransform: "capitalize",
                                }}
                            >
                                {f.type}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
