import { ChevronRight } from "lucide-react";
import { ProcessOptions } from "@/App";

type SettingsSidebarProps = {
    options: ProcessOptions;
    setOptions: React.Dispatch<React.SetStateAction<ProcessOptions>>;
    hasFiles: boolean;
    isProcessing: boolean;
    progress: number;
    progressMsg: string;
    filesCount: number;
    onProcessAll: () => void;
};

const sectionStyle: React.CSSProperties = {
    border: "var(--border-w) solid var(--border)",
    borderRadius: "var(--radius-lg)",
    background: "var(--surface)",
    boxShadow: "var(--shadow)",
    padding: "16px",
};

export default function SettingsSidebar({
    options,
    setOptions,
    hasFiles,
    isProcessing,
    progress,
    progressMsg,
    filesCount,
    onProcessAll,
}: SettingsSidebarProps) {
    return (
        <aside
            className="flex flex-col shrink-0 z-10"
            style={{
                width: "300px",
                borderLeft: "var(--border-w) solid var(--border)",
                background: "var(--bg)",
            }}
        >
            {/* Scrollable settings area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                <h2
                    style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        color: "var(--text)",
                        margin: 0,
                    }}
                >
                    Export Settings
                </h2>

                {/* Detection Tolerance */}
                <div style={sectionStyle}>
                    <div className="flex items-center justify-between mb-4">
                        <label
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                color: "var(--text)",
                            }}
                        >
                            Detection Tolerance
                        </label>
                        <div
                            style={{
                                background: "var(--purple)",
                                border: "var(--border-w) solid var(--border)",
                                borderRadius: "8px",
                                padding: "2px 10px",
                                fontFamily: "'Nunito', sans-serif",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                color: "#fff",
                                boxShadow: "2px 2px 0px var(--border)",
                            }}
                        >
                            {options.tolerance}%
                        </div>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={options.tolerance}
                        onChange={(e) => setOptions(o => ({ ...o, tolerance: Number(e.target.value) }))}
                        className="w-full h-2 rounded-lg cursor-pointer accent-[var(--teal)]"
                        style={{
                            border: "2px solid var(--border)",
                            background: "var(--bg-card)",
                        }}
                    />
                </div>

                {/* Output Format */}
                <div style={sectionStyle}>
                    <label
                        className="block mb-3"
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: "var(--text)",
                        }}
                    >
                        Output Format
                    </label>
                    <select
                        value={options.output_format}
                        onChange={(e) => setOptions(o => ({ ...o, output_format: e.target.value }))}
                        className="w-full h-11 px-3 text-sm font-semibold rounded-xl cursor-pointer"
                        style={{
                            border: "var(--border-w) solid var(--border)",
                            background: "var(--bg-card)",
                            boxShadow: "var(--shadow)",
                            color: "var(--text)",
                            fontFamily: "'Space Grotesk', sans-serif",
                            outline: "none",
                        }}
                    >
                        <option value="Same as source">Same as source</option>
                        <option value="png">PNG (Lossless)</option>
                        <option value="jpg">JPEG (Compressed)</option>
                        <option value="webp">WebP</option>
                    </select>
                </div>

                {/* Toggles */}
                <div style={sectionStyle} className="flex flex-col gap-4">
                    {/* Padding toggle */}
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => setOptions(o => ({ ...o, padding: !o.padding }))}>
                        <div>
                            <p
                                style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "var(--text)",
                                    margin: 0,
                                }}
                            >
                                Padding
                            </p>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                                Adds 10px buffer around crop edge
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={options.padding}
                            className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out items-center"
                            style={{
                                border: "2px solid var(--border)",
                                background: options.padding ? "var(--teal)" : "var(--bg-card)",
                                boxShadow: options.padding ? "1px 1px 0 var(--border)" : "none",
                            }}
                        >
                            <span
                                className="inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-in-out"
                                style={{
                                    border: "1.5px solid var(--border)",
                                    transform: options.padding ? "translateX(22px)" : "translateX(2px)",
                                }}
                            />
                        </button>
                    </div>

                    <div style={{ height: "var(--border-w)", background: "var(--border)", borderRadius: "99px" }} />

                    {/* Delete originals toggle */}
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => {
                        setOptions(o => {
                            if (!o.delete_original) {
                                const ok = window.confirm(
                                    "Delete Originals permanently removes source files after a successful crop. Continue?",
                                );
                                if (!ok) return o;
                            }
                            return { ...o, delete_original: !o.delete_original };
                        });
                    }}>
                        <div>
                            <p
                                style={{
                                    fontFamily: "'Nunito', sans-serif",
                                    fontWeight: 800,
                                    fontSize: "0.85rem",
                                    color: "var(--pink)",
                                    margin: 0,
                                    textDecoration: options.delete_original ? "underline" : "none",
                                    textDecorationColor: "var(--pink)",
                                }}
                            >
                                Delete Originals
                            </p>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                                Removes source files after processing
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={options.delete_original}
                            className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out items-center"
                            style={{
                                border: "2px solid var(--border)",
                                background: options.delete_original ? "var(--pink)" : "var(--bg-card)",
                                boxShadow: options.delete_original ? "1px 1px 0 var(--border)" : "none",
                            }}
                        >
                            <span
                                className="inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-in-out"
                                style={{
                                    border: "1.5px solid var(--border)",
                                    transform: options.delete_original ? "translateX(22px)" : "translateX(2px)",
                                }}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Process Button area */}
            <div
                className="p-5 shrink-0"
                style={{ borderTop: "var(--border-w) solid var(--border)" }}
            >
                <button
                    disabled={!hasFiles || isProcessing}
                    onClick={onProcessAll}
                    className="relative w-full flex items-center justify-center gap-2 font-display transition-all duration-200 overflow-hidden"
                    style={{
                        height: "52px",
                        border: "var(--border-w) solid var(--border)",
                        borderRadius: "16px",
                        background: !hasFiles || isProcessing ? "var(--bg-card)" : "var(--text)",
                        color: !hasFiles || isProcessing ? "var(--text-muted)" : "var(--bg)",
                        boxShadow: !hasFiles || isProcessing ? "none" : "var(--shadow-lg)",
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800,
                        fontSize: "1rem",
                        cursor: !hasFiles || isProcessing ? "not-allowed" : "pointer",
                        transform: "translateY(0)",
                        transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseDown={e => {
                        if (hasFiles && !isProcessing) {
                            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(3px)";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px var(--border)";
                        }
                    }}
                    onMouseUp={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = hasFiles && !isProcessing ? "var(--shadow-lg)" : "none";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = hasFiles && !isProcessing ? "var(--shadow-lg)" : "none";
                    }}
                >
                    {/* Progress bar fill */}
                    {isProcessing && (
                        <div
                            className="absolute left-0 top-0 h-full transition-all duration-300"
                            style={{
                                width: `${progress}%`,
                                background: "var(--teal)",
                                opacity: 0.25,
                                borderRadius: "inherit",
                            }}
                        />
                    )}

                    <div className="relative flex items-center gap-2">
                        {isProcessing ? (
                            <>
                                <div
                                    className="animate-spin"
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "50%",
                                        border: "3px solid var(--text-muted)",
                                        borderTopColor: "var(--bg)",
                                    }}
                                />
                                <span>{progressMsg || "Processing..."} {Math.round(progress)}%</span>
                            </>
                        ) : (
                            <>
                                <span>Process Files</span>
                                {hasFiles && (
                                    <span
                                        style={{
                                            background: "var(--pink)",
                                            color: "#fff",
                                            borderRadius: "8px",
                                            padding: "0 8px",
                                            fontSize: "0.75rem",
                                            fontWeight: 800,
                                            border: "2px solid var(--border)",
                                        }}
                                    >
                                        {filesCount}
                                    </span>
                                )}
                                <ChevronRight size={18} />
                            </>
                        )}
                    </div>
                </button>

                {!hasFiles && !isProcessing && (
                    <p
                        className="text-center mt-3"
                        style={{
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: "var(--pink)",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                        }}
                    >
                        Drop files to begin
                    </p>
                )}
            </div>
        </aside>
    );
}
