/**
 * Dev-only Tauri shim. When the UI is opened in a plain browser (`npm run dev`
 * without the Tauri shell) there is no Rust backend, so every `invoke()` would
 * fail. This installs fake commands + sample media so the whole interface can
 * be exercised and screenshotted without building the desktop app.
 *
 * It is only imported behind `import.meta.env.DEV` in `main.tsx`, so it never
 * reaches a production bundle.
 */
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { emit } from "@tauri-apps/api/event";

import sunsetBeach from "./samples/sunset-beach.svg?url";
import mountainLake from "./samples/mountain-lake.svg?url";
import cityNight from "./samples/city-night.svg?url";
import pineForest from "./samples/pine-forest.svg?url";
import portraitStudy from "./samples/portrait-study.svg?url";
import studioDemo from "./samples/studio-demo.mp4?url";

type Sample = {
    url: string;
    type: "image" | "video";
    ext: string;
    width: number;
    height: number;
    crop: { x: number; y: number; w: number; h: number };
};

const SAMPLES: Record<string, Sample> = {
    "sunset-beach": { url: sunsetBeach, type: "image", ext: "png", width: 1600, height: 1000, crop: { x: 0, y: 140, w: 1600, h: 720 } },
    "mountain-lake": { url: mountainLake, type: "image", ext: "jpg", width: 1600, height: 900, crop: { x: 180, y: 0, w: 1240, h: 900 } },
    "city-night": { url: cityNight, type: "image", ext: "png", width: 1600, height: 1000, crop: { x: 90, y: 70, w: 1420, h: 860 } },
    "pine-forest": { url: pineForest, type: "image", ext: "webp", width: 1600, height: 1000, crop: { x: 0, y: 110, w: 1600, h: 780 } },
    "portrait-study": { url: portraitStudy, type: "image", ext: "jpg", width: 1000, height: 1500, crop: { x: 110, y: 0, w: 780, h: 1500 } },
    "studio-demo": { url: studioDemo, type: "video", ext: "mp4", width: 640, height: 360, crop: { x: 0, y: 45, w: 640, h: 270 } },
};

const INPUT_DIR = "C:\\Users\\demo\\Pictures";
const OUTPUT_DIR = "C:\\Users\\demo\\Documents\\AutoCrop_Output";

const sampleKey = (path: string) => {
    const base = path.split(/[\\/]/).pop() ?? path;
    return base.replace(/\.[^.]+$/, "").replace(/_cropped$/, "");
};

/** Tweakable from the devtools console / test scripts via `window.__mockTauri`. */
export const mockState = {
    outputs: [] as { name: string; path: string; file_type: string; modified_at: number }[],
    saveLocation: OUTPUT_DIR,
    latencyMs: 450,
    /** Command names that should reject, to exercise error toasts. */
    failing: new Set<string>(),
};

const nowSec = () => Math.floor(Date.now() / 1000);

function seedOutputs() {
    const ages = [30, 60 * 12, 3600 * 3, 3600 * 30, 86400 * 4, 86400 * 9];
    mockState.outputs = Object.entries(SAMPLES).map(([key, s], i) => ({
        name: `${key}_cropped.${s.ext}`,
        path: `${OUTPUT_DIR}\\${key}_cropped.${s.ext}`,
        file_type: s.type,
        modified_at: nowSec() - ages[i],
    }));
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function installTauriMock() {
    seedOutputs();
    mockWindows("main");

    mockIPC(
        async (cmd, args) => {
            const a = (args ?? {}) as Record<string, unknown>;
            if (mockState.failing.has(cmd)) throw `mock failure for "${cmd}"`;
            switch (cmd) {
                case "plugin:dialog|open": {
                    const opts = a.options as { directory?: boolean } | undefined;
                    if (opts?.directory) return "D:\\Exports\\AutoCrop";
                    return Object.entries(SAMPLES).map(([k, s]) => `${INPUT_DIR}\\${k}.${s.ext}`);
                }
                case "detect_crop_areas": {
                    await sleep(mockState.latencyMs);
                    const s = SAMPLES[sampleKey(String(a.filePath))];
                    return s ? s.crop : { x: 0, y: 0, w: 0, h: 0 };
                }
                case "process_files": {
                    const items = (a.items as unknown[]) ?? [];
                    const total = Math.max(items.length, 1);
                    for (let i = 1; i <= total; i++) {
                        await sleep(500);
                        await emit("crop-progress", { current: i, total, message: `Cropping ${i} of ${total}` });
                    }
                    return null;
                }
                case "get_save_location":
                    return mockState.saveLocation;
                case "set_save_location":
                    mockState.saveLocation = (a.path as string) || OUTPUT_DIR;
                    return null;
                case "list_output_files":
                    await sleep(mockState.latencyMs / 2);
                    return mockState.outputs;
                case "reveal_in_explorer":
                case "open_output_folder":
                    return null;
                default:
                    return null;
            }
        },
        { shouldMockEvents: true },
    );

    // `convertFileSrc` is read straight off the internals object. Point every
    // "disk" path at the bundled sample with the same name.
    const internals = (window as unknown as { __TAURI_INTERNALS__: Record<string, unknown> }).__TAURI_INTERNALS__;
    internals.convertFileSrc = (path: string) => SAMPLES[sampleKey(path)]?.url ?? "";

    (window as unknown as { __mockTauri: typeof mockState }).__mockTauri = mockState;
}
