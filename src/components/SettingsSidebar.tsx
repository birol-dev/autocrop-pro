import { ChevronRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
                        <Label
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                color: "var(--text)",
                            }}
                        >
                            Detection Tolerance
                        </Label>
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
                    <Slider
                        value={[options.tolerance]}
                        onValueChange={(val) => setOptions(o => ({ ...o, tolerance: val[0] }))}
                        max={100}
                        step={1}
                        className="[&_[role=slider]]:border-[3px] [&_[role=slider]]:border-[var(--border)] [&_[role=slider]]:shadow-[2px_2px_0px_var(--border)] [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:bg-[var(--teal)] [&>span]:bg-[var(--border)] [&>span]:h-[3px] [&_[data-orientation=horizontal]>span]:bg-[var(--teal)]"
                    />
                </div>

                {/* Output Format */}
                <div style={sectionStyle}>
                    <Label
                        className="block mb-3"
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: "var(--text)",
                        }}
                    >
                        Output Format
                    </Label>
                    <Select value={options.output_format} onValueChange={(val) => setOptions(o => ({ ...o, output_format: val }))}>
                        <SelectTrigger
                            className="h-11 text-sm font-semibold focus:ring-0 focus:ring-offset-0"
                            style={{
                                border: "var(--border-w) solid var(--border)",
                                borderRadius: "12px",
                                background: "var(--bg-card)",
                                boxShadow: "var(--shadow)",
                                color: "var(--text)",
                                fontFamily: "'Space Grotesk', sans-serif",
                            }}
                        >
                            <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent
                            style={{
                                border: "var(--border-w) solid var(--border)",
                                borderRadius: "14px",
                                background: "var(--surface)",
                                boxShadow: "var(--shadow-lg)",
                                color: "var(--text)",
                            }}
                        >
                            {["Same as source", "png", "jpg", "webp"].map(fmt => (
                                <SelectItem
                                    key={fmt}
                                    value={fmt}
                                    className="rounded-lg cursor-pointer font-medium"
                                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                >
                                    {fmt === "Same as source" ? "Same as source" : fmt === "png" ? "PNG (Lossless)" : fmt === "jpg" ? "JPEG (Compressed)" : "WebP"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Toggles */}
                <div style={sectionStyle} className="flex flex-col gap-4">
                    {/* Padding toggle */}
                    <label className="flex items-center justify-between cursor-pointer group">
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
                        <Switch
                            checked={options.padding}
                            onCheckedChange={(c) => setOptions(o => ({ ...o, padding: c }))}
                            className="data-[state=checked]:bg-[var(--teal)] data-[state=unchecked]:bg-[var(--bg-card)] border-[3px] border-[var(--border)]"
                        />
                    </label>

                    <div style={{ height: "var(--border-w)", background: "var(--border)", borderRadius: "99px" }} />

                    {/* Delete originals toggle */}
                    <label className="flex items-center justify-between cursor-pointer group">
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
                        <Switch
                            checked={options.delete_original}
                            onCheckedChange={(c) => setOptions(o => ({ ...o, delete_original: c }))}
                            className="data-[state=checked]:bg-[var(--pink)] data-[state=unchecked]:bg-[var(--bg-card)] border-[3px] border-[var(--border)]"
                        />
                    </label>
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
