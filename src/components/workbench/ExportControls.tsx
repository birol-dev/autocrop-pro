import type { ReactNode } from "react";
import { Loader, Select, Slider, Switch } from "@mantine/core";

import { workbench as classes } from "./Workbench";

export const switchClasses = { label: classes.switchLabel, track: classes.switchTrack, thumb: classes.switchThumb };

type ExportControlsProps<F extends string> = {
    tolerance: number;
    onTolerance: (value: number) => void;
    format: F;
    formats: { value: F; label: string }[];
    onFormat: (value: F) => void;
    padding: boolean;
    onPadding: (value: boolean) => void;
    /** More switches, after padding. */
    extra?: ReactNode;
    fileCount: number;
    busy: boolean;
    /** What the batch is doing right now. */
    status?: string;
    /** The quiet line under the controls when nothing is running. */
    note: string;
    onProcess: () => void;
};

/** The one slider, the few options, and the button that runs the batch. */
export default function ExportControls<F extends string>({
    tolerance,
    onTolerance,
    format,
    formats,
    onFormat,
    padding,
    onPadding,
    extra,
    fileCount,
    busy,
    status,
    note,
    onProcess,
}: ExportControlsProps<F>) {
    return (
        <div className={classes.controls}>
            <div className={classes.tolerance}>
                <span id="tolerance-label">Detection tolerance</span>
                <Slider
                    className={classes.slider}
                    min={0}
                    max={100}
                    step={1}
                    size="sm"
                    color="var(--ink)"
                    value={tolerance}
                    onChange={onTolerance}
                    disabled={busy}
                    label={null}
                    thumbLabel="Detection tolerance"
                />
                <span className={classes.toleranceValue}>{tolerance}%</span>
            </div>

            <div className={classes.options}>
                <Select
                    className={classes.format}
                    aria-label="Output format"
                    data={formats}
                    value={format}
                    onChange={(v) => v && onFormat(v as F)}
                    allowDeselect={false}
                    disabled={busy}
                    classNames={{ input: classes.formatInput }}
                    comboboxProps={{ withinPortal: true, radius: "md" }}
                />
                <Switch
                    label="Add 10px padding"
                    withThumbIndicator={false}
                    color="var(--ink)"
                    classNames={switchClasses}
                    checked={padding}
                    disabled={busy}
                    onChange={(e) => onPadding(e.currentTarget.checked)}
                />
                {extra}
                <button
                    type="button"
                    className={classes.action}
                    onClick={onProcess}
                    disabled={!fileCount || busy}
                    aria-busy={busy || undefined}
                >
                    {busy && <Loader size={14} color="currentColor" />}
                    {busy ? "Processing" : `Process ${fileCount} ${fileCount === 1 ? "file" : "files"}`}
                </button>
            </div>

            <p className={classes.foot} role={status ? "status" : undefined}>
                {status ? <span className={classes.status}>{status}</span> : <span>{note}</span>}
            </p>
        </div>
    );
}
