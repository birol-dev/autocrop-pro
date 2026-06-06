import { useState, useEffect, useCallback } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { RefreshCw, FolderOpen, Play, Clock, Grid2X2 } from "lucide-react";
import { toast } from "sonner";
import { OutputFile } from "@/App";

type OutputsPanelProps = {
    /** Trigger a refresh whenever this counter increments (e.g. after processing) */
    refreshTick: number;
};

function timeAgo(unixSec: number): string {
    const diff = Math.floor(Date.now() / 1000) - unixSec;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function OutputsPanel({ refreshTick }: OutputsPanelProps) {
    const [files, setFiles] = useState<OutputFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [lightbox, setLightbox] = useState<OutputFile | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await invoke<OutputFile[]>("list_output_files");
            setFiles(result);
        } catch (err) {
            toast.error(`Failed to load outputs: ${String(err)}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load on mount and whenever refreshTick changes
    useEffect(() => { load(); }, [load, refreshTick]);

    const handleDoubleClick = async (file: OutputFile) => {
        try {
            await invoke("reveal_in_explorer", { path: file.path });
        } catch (err) {
            toast.error(`Could not open folder: ${String(err)}`);
        }
    };

    const handleOpenFolder = async () => {
        try {
            await invoke("open_output_folder");
        } catch (err) {
            toast.error(`Could not open folder: ${String(err)}`);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-16">
                <div
                    className="animate-spin"
                    style={{
                        width: "36px", height: "36px",
                        borderRadius: "50%",
                        border: "3px solid var(--border)",
                        borderTopColor: "var(--teal)",
                    }}
                />
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading outputs…</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 pb-16" style={{ minHeight: 0 }}>
            {/* Toolbar */}
            <div className="flex items-center justify-between">
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
                        Outputs
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenFolder}
                        className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                        style={{
                            padding: "6px 12px",
                            border: "2px solid var(--border)",
                            borderRadius: "10px",
                            background: "var(--surface)",
                            boxShadow: "var(--shadow)",
                            color: "var(--text)",
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <FolderOpen size={14} />
                        Open Folder
                    </button>
                    <button
                        onClick={load}
                        className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                        style={{
                            width: "34px", height: "34px",
                            border: "2px solid var(--border)",
                            borderRadius: "10px",
                            background: "var(--surface)",
                            boxShadow: "var(--shadow)",
                            color: "var(--text)",
                            cursor: "pointer",
                        }}
                        title="Refresh"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Empty state */}
            {files.length === 0 && (
                <div
                    className="flex flex-col items-center justify-center gap-4"
                    style={{
                        flex: 1,
                        minHeight: "200px",
                        border: "2px dashed var(--border)",
                        borderRadius: "20px",
                        background: "var(--bg-card)",
                    }}
                >
                    <div
                        style={{
                            width: "56px", height: "56px",
                            border: "2px solid var(--border)",
                            borderRadius: "14px",
                            background: "var(--surface)",
                            boxShadow: "var(--shadow)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--text-muted)",
                        }}
                    >
                        <Grid2X2 size={24} />
                    </div>
                    <div className="text-center">
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "var(--text)", margin: 0 }}>
                            No outputs yet
                        </p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            Process some files to see them here
                        </p>
                    </div>
                </div>
            )}

            {/* Grid */}
            {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {files.map((file) => (
                        <div
                            key={file.path}
                            onClick={() => setLightbox(file)}
                            onDoubleClick={() => handleDoubleClick(file)}
                            className="group cursor-pointer overflow-hidden transition-all duration-200"
                            style={{
                                border: "var(--border-w) solid var(--border)",
                                borderRadius: "16px",
                                background: "var(--surface)",
                                boxShadow: "var(--shadow)",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px, -2px)";
                                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = "translate(0,0)";
                                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow)";
                            }}
                            title="Click to preview · Double-click to reveal in Explorer"
                        >
                            {/* Thumbnail */}
                            <div
                                className="w-full relative overflow-hidden flex items-center justify-center"
                                style={{ height: "110px", borderBottom: "var(--border-w) solid var(--border)", background: "var(--bg-card)" }}
                            >
                                {file.file_type === "video" ? (
                                    <>
                                        <video
                                            src={`${convertFileSrc(file.path)}#t=0.1`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            preload="metadata"
                                            onError={e => { (e.target as HTMLVideoElement).style.display = "none"; }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.3)" }}>
                                            <div className="flex items-center justify-center" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fff", border: "2px solid var(--border)" }}>
                                                <Play size={12} fill="var(--text)" color="var(--text)" className="translate-x-0.5" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={convertFileSrc(file.path)}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={file.name}
                                        loading="lazy"
                                        onError={e => {
                                            const t = e.target as HTMLImageElement;
                                            t.style.display = "none";
                                            const placeholder = t.parentElement;
                                            if (placeholder) {
                                                placeholder.style.display = "flex";
                                                placeholder.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
                                            }
                                        }}
                                    />
                                )}
                            </div>

                            {/* Info */}
                            <div style={{ padding: "8px 10px" }}>
                                <p
                                    className="truncate"
                                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "0.75rem", color: "var(--text)", margin: 0 }}
                                    title={file.name}
                                >
                                    {file.name}
                                </p>
                                <div className="flex items-center gap-1" style={{ marginTop: "3px" }}>
                                    <Clock size={10} style={{ color: "var(--text-muted)" }} />
                                    <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: 0 }}>
                                        {timeAgo(file.modified_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative max-w-5xl w-full mx-6 overflow-hidden"
                        style={{
                            border: "var(--border-w) solid var(--border)",
                            borderRadius: "20px",
                            background: "var(--surface)",
                            boxShadow: "var(--shadow-lg)",
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-5 py-3"
                            style={{ borderBottom: "var(--border-w) solid var(--border)" }}
                        >
                            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", margin: 0 }}>
                                {lightbox.name}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDoubleClick(lightbox)}
                                    className="flex items-center gap-2"
                                    style={{
                                        padding: "5px 12px",
                                        border: "2px solid var(--border)",
                                        borderRadius: "8px",
                                        background: "var(--teal)",
                                        color: "#fff",
                                        fontFamily: "'Nunito', sans-serif",
                                        fontWeight: 700,
                                        fontSize: "0.78rem",
                                        cursor: "pointer",
                                        boxShadow: "2px 2px 0 var(--border)",
                                    }}
                                >
                                    <FolderOpen size={13} />
                                    Reveal in Explorer
                                </button>
                                <button
                                    onClick={() => setLightbox(null)}
                                    style={{
                                        width: "30px", height: "30px",
                                        border: "2px solid var(--border)",
                                        borderRadius: "8px",
                                        background: "var(--pink)",
                                        color: "#fff",
                                        fontFamily: "'Nunito', sans-serif",
                                        fontWeight: 800,
                                        fontSize: "1rem",
                                        cursor: "pointer",
                                        boxShadow: "2px 2px 0 var(--border)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Media */}
                        <div className="flex items-center justify-center p-4" style={{ background: "var(--bg-card)", maxHeight: "70vh" }}>
                            {lightbox.file_type === "video" ? (
                                <video
                                    src={convertFileSrc(lightbox.path)}
                                    className="max-w-full max-h-[65vh] object-contain"
                                    controls autoPlay muted
                                />
                            ) : (
                                <img
                                    src={convertFileSrc(lightbox.path)}
                                    className="max-w-full max-h-[65vh] object-contain"
                                    alt={lightbox.name}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
