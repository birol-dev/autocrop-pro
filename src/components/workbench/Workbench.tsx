import type { ReactNode } from "react";

import classes from "./Workbench.module.css";

export type BarTab<T extends string> = { value: T; label: string; count?: number };

type WindowBarProps<T extends string> = {
    tabs: BarTab<T>[];
    active: T;
    onChange: (value: T) => void;
    /** Left of the tabs: the app's name, where the page doesn't already show it. */
    brand?: ReactNode;
    /** Pushed to the far end of the bar. */
    children?: ReactNode;
    /** 0–1 while a batch runs: drawn as a line along the bar's bottom edge. */
    progress?: number | null;
};

/** The strip across the top of the tool: pill tabs, a count, and the batch's progress line. */
export function WindowBar<T extends string>({ tabs, active, onChange, brand, children, progress }: WindowBarProps<T>) {
    return (
        <div className={classes.bar} data-tauri-drag-region>
            {brand}
            <div className={classes.tabs} role="tablist" aria-label="Views">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        className={classes.tab}
                        aria-selected={tab.value === active}
                        onClick={() => onChange(tab.value)}
                    >
                        {tab.label}
                        {!!tab.count && <span className={classes.tabCount}>{tab.count}</span>}
                    </button>
                ))}
            </div>
            <div className={classes.barEnd}>{children}</div>
            {progress != null && (
                <span
                    className={classes.progress}
                    style={{ transform: `scaleX(${progress})` }}
                    role="progressbar"
                    aria-label="Processing progress"
                    aria-valuenow={Math.round(progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            )}
        </div>
    );
}

/** "3 images · 1 video": what's in the queue, in words. */
export function summarize(items: { type: "image" | "video" }[]): string {
    const videos = items.filter((f) => f.type === "video").length;
    const images = items.length - videos;
    const parts: string[] = [];
    if (images) parts.push(`${images} ${images === 1 ? "image" : "images"}`);
    if (videos) parts.push(`${videos} ${videos === 1 ? "video" : "videos"}`);
    return parts.join(" · ");
}

export { classes as workbench };
