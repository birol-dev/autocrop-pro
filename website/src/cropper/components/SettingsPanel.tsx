import { Loader, Progress, Select, Slider, Switch } from "@mantine/core";

import { Pill } from "../../components/Section";
import type { Options, OutputFormat, Progress as ProgressState } from "../types";
import classes from "./SettingsPanel.module.css";

type Props = {
  options: Options;
  fileCount: number;
  processing: boolean;
  progress: ProgressState;
  onTolerance: (v: number) => void;
  onPadding: (v: boolean) => void;
  onFormat: (v: OutputFormat) => void;
  onProcess: () => void;
};

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "same", label: "Same as source" },
  { value: "png", label: "PNG (Lossless)" },
  { value: "jpg", label: "JPEG (Compressed)" },
  { value: "webp", label: "WebP" },
];

// Label on the left, switch on the right.
const switchStyles = {
  body: { justifyContent: "space-between", alignItems: "center", width: "100%" },
  labelWrapper: { flex: 1 },
} as const;

export default function SettingsPanel({
  options,
  fileCount,
  processing,
  progress,
  onTolerance,
  onPadding,
  onFormat,
  onProcess,
}: Props) {
  const hasFiles = fileCount > 0;
  const pct = Math.round(progress.ratio * 100);

  return (
    <div className={classes.panel}>
      <div>
        <h2 className={classes.title}>Export settings</h2>
        <p className={classes.hint}>Applied to every file in the queue.</p>
      </div>

      <div>
        <div className={classes.row}>
          <span className={classes.label} id="tolerance-label">
            Detection tolerance
          </span>
          <span className={classes.value}>{options.tolerance}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={options.tolerance}
          onChange={onTolerance}
          disabled={processing}
          label={null}
          size="sm"
          marks={[
            { value: 0, label: "0" },
            { value: 50, label: "50" },
            { value: 100, label: "100" },
          ]}
          mt={8}
          mb={32}
          thumbLabel="Detection tolerance"
        />
        <p className={classes.hint}>Higher values treat more dark pixels as border.</p>
      </div>

      <div>
        <Select
          label="Image output format"
          data={FORMATS}
          value={options.outputFormat}
          onChange={(v) => v && onFormat(v as OutputFormat)}
          allowDeselect={false}
          disabled={processing}
          size="md"
          classNames={{ label: classes.fieldLabel, input: classes.input }}
          comboboxProps={{ withinPortal: true, radius: "md" }}
        />
        <p className={classes.hint}>Videos keep MP4 or WebM. GIF exports as PNG.</p>
      </div>

      <Switch
        label="10px padding"
        description="Keep a buffer so captions are not clipped"
        labelPosition="left"
        styles={switchStyles}
        classNames={{ label: classes.fieldLabel }}
        checked={options.padding}
        disabled={processing}
        onChange={(e) => onPadding(e.currentTarget.checked)}
      />

      <div className={classes.footer}>
        {progress.visible && (
          <div className={classes.progress} role="status" aria-live="polite">
            <div className={classes.row}>
              <span className={classes.status}>{progress.message || "Working…"}</span>
              <span className={classes.value}>{pct}%</span>
            </div>
            <Progress value={pct} size={2} radius={0} aria-label="Processing progress" className={classes.track} />
          </div>
        )}

        <Pill
          size="lg"
          className={classes.process}
          onClick={onProcess}
          disabled={!hasFiles || processing}
          aria-busy={processing || undefined}
          icon={processing ? <Loader size={16} color="currentColor" /> : undefined}
        >
          {processing ? "Processing" : hasFiles ? `Process ${fileCount} ${fileCount === 1 ? "file" : "files"}` : "Process files"}
        </Pill>

        {!hasFiles && !processing && <p className={classes.addHint}>Add files to get started</p>}
      </div>
    </div>
  );
}
