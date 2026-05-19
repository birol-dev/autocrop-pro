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
        <aside className="w-80 border-l border-white/5 bg-zinc-950/80 backdrop-blur-2xl flex flex-col z-10 shrink-0 shadow-2xl relative">
            <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                    Export Settings
                    <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                </h2>

                <div className="space-y-8">
                    {/* Tolerance Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                            <Label className="text-sm font-medium text-zinc-300">Detection Tolerance</Label>
                            <div className="px-2 py-1 rounded-md bg-zinc-800 text-xs font-mono text-indigo-300">
                                {options.tolerance}%
                            </div>
                        </div>
                        <div className="px-1">
                            <Slider
                                value={[options.tolerance]}
                                onValueChange={(val) => setOptions(o => ({ ...o, tolerance: val[0] }))}
                                max={100}
                                step={1}
                                className="[&_[role=slider]]:bg-indigo-500 [&_[role=slider]]:border-4 [&_[role=slider]]:border-zinc-950 [&_[role=slider]]:shadow-xl [&>span]:bg-zinc-800 [&_[data-orientation=horizontal]>span]:bg-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Format Select */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-zinc-300 pl-1">Output Format</Label>
                        <Select value={options.output_format} onValueChange={(val) => setOptions(o => ({ ...o, output_format: val }))}>
                            <SelectTrigger className="bg-zinc-900/50 border-white/5 text-zinc-300 h-12 rounded-xl focus:ring-1 focus:ring-indigo-500/50 transition-all">
                                <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 rounded-xl shadow-2xl">
                                <SelectItem value="Same as source" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">Same as source</SelectItem>
                                <SelectItem value="png" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">PNG (Lossless)</SelectItem>
                                <SelectItem value="jpg" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">JPEG (Compressed)</SelectItem>
                                <SelectItem value="webp" className="focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg cursor-pointer">WebP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2 bg-zinc-900/30 rounded-2xl border border-white/5 p-2">
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                            <div className="space-y-0.5">
                                <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">Padding</span>
                                <p className="text-[10px] text-zinc-500">Adds 10px buffer around crop edge</p>
                            </div>
                            <Switch
                                checked={options.padding}
                                onCheckedChange={(c) => setOptions(o => ({ ...o, padding: c }))}
                                className="data-[state=checked]:bg-indigo-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-red-500/5 transition-colors cursor-pointer group">
                            <div className="space-y-0.5">
                                <span className="text-sm font-medium text-zinc-300 group-hover:text-red-400 transition-colors">Delete Originals</span>
                                <p className="text-[10px] text-red-500/70">Removes source files after processing</p>
                            </div>
                            <Switch
                                checked={options.delete_original}
                                onCheckedChange={(c) => setOptions(o => ({ ...o, delete_original: c }))}
                                className="data-[state=checked]:bg-red-500"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Process Button */}
            <div className="p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent sticky bottom-0">
                <button
                    disabled={!hasFiles || isProcessing}
                    onClick={onProcessAll}
                    className="group relative w-full h-14 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-900 font-semibold rounded-2xl transition-all duration-300 overflow-hidden shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)] disabled:shadow-none"
                >
                    {isProcessing && (
                        <div className="absolute inset-0 bg-indigo-500/10">
                            <div className="h-full bg-indigo-500/20 absolute left-0 top-0 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                        </div>
                    )}

                    <div className="relative flex items-center gap-2">
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-zinc-900/30 border-t-zinc-900 animate-spin" />
                                <span>{progressMsg || "Processing..."} {Math.round(progress)}%</span>
                            </>
                        ) : (
                            <>
                                <span>Process Files</span>
                                {hasFiles && (
                                    <span className="bg-zinc-900/10 px-2 py-0.5 rounded-lg text-xs ml-1 font-bold">{filesCount}</span>
                                )}
                                <ChevronRight size={18} className="text-zinc-400 group-hover:text-zinc-900 transition-colors group-hover:translate-x-1 duration-300" />
                            </>
                        )}
                    </div>
                </button>
                {!hasFiles && !isProcessing && (
                    <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest font-medium">Drop files to begin</p>
                )}
            </div>
        </aside>
    );
}
