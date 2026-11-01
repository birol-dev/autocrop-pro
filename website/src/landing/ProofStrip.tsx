import { Cell, Cells, Chapter } from "../components/Section";
import classes from "./ProofStrip.module.css";

const FORMATS = [
  { label: "Images", formats: ["JPG", "PNG", "WEBP", "BMP", "GIF", "TIFF"] },
  { label: "Videos", formats: ["MP4", "MOV", "MKV", "AVI", "WEBM", "FLV"] },
];

const STATS = [
  { value: "100%", label: "Offline, no cloud uploads" },
  { value: "0 MB", label: "Data sent to servers" },
  { value: "500+", label: "Files per batch run" },
  { value: "Parallel", label: "Rayon multi-core threads" },
];

/** Supported formats + headline numbers, directly under the hero. */
export default function ProofStrip() {
  return (
    <Chapter tone="paper" flushTop className={classes.strip}>
      <div className={classes.formats} role="group" aria-label="Supported file formats">
        {FORMATS.map((group) => (
          <p key={group.label} className={classes.group}>
            <span className={classes.groupLabel}>{group.label}</span> {group.formats.join("  ")}
          </p>
        ))}
      </div>

      <Cells cols={4} colsMobile={2}>
        {STATS.map((s) => (
          <Cell key={s.label} tall>
            <span className={classes.value}>{s.value}</span>
            <span className={classes.label}>{s.label}</span>
          </Cell>
        ))}
      </Cells>
    </Chapter>
  );
}
