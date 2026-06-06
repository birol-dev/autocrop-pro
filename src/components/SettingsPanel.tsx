import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FolderOpen, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPanel() {
    const [saveLocation, setSaveLocation] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        invoke<string>("get_save_location")
            .then(setSaveLocation)
            .catch(err => toast.error(`Failed to load settings: ${String(err)}`));
    }, []);

    const handleBrowse = async () => {
        setLoading(true);
        try {
            const chosen = await invoke<string | null>("pick_save_folder");
            if (chosen) {
                setSaving(true);
                await invoke("set_save_location", { path: chosen });
                setSaveLocation(chosen);
                toast.success("Save location updated!");
            }
        } catch (err) {
            toast.error(`Failed to set location: ${String(err)}`);
        } finally {
            setLoading(false);
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        try {
            await invoke("set_save_location", { path: "" });
            const def = await invoke<string>("get_save_location");
            setSaveLocation(def);
            toast.success("Reset to default location");
        } catch (err) {
            toast.error(`Failed to reset: ${String(err)}`);
        } finally {
            setSaving(false);
        }
    };

    const cardStyle: React.CSSProperties = {
        border: "var(--border-w) solid var(--border)",
        borderRadius: "18px",
        background: "var(--surface)",
        boxShadow: "var(--shadow)",
        padding: "20px",
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: "0.9rem",
        color: "var(--text)",
        marginBottom: "4px",
    };

    const descStyle: React.CSSProperties = {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "0.78rem",
        color: "var(--text-muted)",
        marginBottom: "14px",
        margin: "4px 0 14px 0",
    };

    return (
        <div className="flex flex-col gap-5 pb-16">
            <h2
                style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "var(--text)",
                    margin: 0,
                }}
            >
                Settings
            </h2>

            {/* Save Location */}
            <div style={cardStyle}>
                <p style={labelStyle}>Output Save Location</p>
                <p style={descStyle}>Processed files will be saved here. Defaults to Documents/AutoCrop_Output.</p>

                {/* Path display */}
                <div
                    className="flex items-center gap-2 mb-4"
                    style={{
                        border: "var(--border-w) solid var(--border)",
                        borderRadius: "12px",
                        padding: "10px 14px",
                        background: "var(--bg-card)",
                        boxShadow: "inset 2px 2px 0 rgba(0,0,0,0.05)",
                        minHeight: "44px",
                    }}
                >
                    <FolderOpen size={15} style={{ color: "var(--teal)", flexShrink: 0 }} />
                    <p
                        className="truncate flex-1"
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: "0.8rem",
                            color: saveLocation ? "var(--text)" : "var(--text-muted)",
                            margin: 0,
                        }}
                        title={saveLocation}
                    >
                        {saveLocation || "Loading…"}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBrowse}
                        disabled={loading || saving}
                        className="flex items-center gap-2 flex-1 justify-center transition-all duration-150"
                        style={{
                            padding: "10px 16px",
                            border: "var(--border-w) solid var(--border)",
                            borderRadius: "12px",
                            background: loading || saving ? "var(--bg-card)" : "var(--text)",
                            color: loading || saving ? "var(--text-muted)" : "var(--bg)",
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            cursor: loading || saving ? "not-allowed" : "pointer",
                            boxShadow: loading || saving ? "none" : "var(--shadow)",
                        }}
                        onMouseDown={e => {
                            if (!loading && !saving) {
                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(3px)";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0 var(--border)";
                            }
                        }}
                        onMouseUp={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = "";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = "";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                        }}
                    >
                        <FolderOpen size={15} />
                        {loading ? "Opening…" : "Browse…"}
                    </button>

                    <button
                        onClick={handleReset}
                        disabled={saving}
                        title="Reset to default"
                        className="flex items-center justify-center transition-all duration-150"
                        style={{
                            width: "44px", height: "44px",
                            border: "var(--border-w) solid var(--border)",
                            borderRadius: "12px",
                            background: "var(--surface)",
                            color: saving ? "var(--text-muted)" : "var(--text)",
                            cursor: saving ? "not-allowed" : "pointer",
                            boxShadow: "var(--shadow)",
                            flexShrink: 0,
                        }}
                        onMouseDown={e => {
                            if (!saving) {
                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(2px)";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0 var(--border)";
                            }
                        }}
                        onMouseUp={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = "";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = "";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                        }}
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>

            {/* About */}
            <div style={cardStyle}>
                <p style={labelStyle}>About</p>
                <p style={{ ...descStyle, marginBottom: 0 }}>
                    AutoCrop Pro automatically detects and removes black / solid-colour borders from images and videos using histogram analysis and FFmpeg's cropdetect filter.
                </p>
                <div className="flex items-center gap-2 mt-4">
                    <span
                        style={{
                            background: "var(--pink)",
                            border: "2px solid var(--border)",
                            borderRadius: "8px",
                            padding: "2px 10px",
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            color: "#fff",
                            boxShadow: "2px 2px 0 var(--border)",
                        }}
                    >
                        v0.1.4
                    </span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        AutoCrop Pro
                    </span>
                </div>
            </div>
        </div>
    );
}
