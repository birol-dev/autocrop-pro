import { Title } from "@mantine/core";

import { Chapter, Fade } from "../components/Section";
import classes from "./Comparison.module.css";

type Row = { method: string; speed: string; privacy: string; preview: string; cost: string; ours?: boolean };

const ROWS: Row[] = [
  {
    method: "AutoCrop Pro (Windows)",
    speed: "500+ files, parallel Rust",
    privacy: "100% offline on your PC",
    preview: "Yes — tolerance slider",
    cost: "Free (MIT)",
    ours: true,
  },
  {
    method: "AutoCrop Pro (Web)",
    speed: "A handful of files, in-tab",
    privacy: "No upload — stays in the browser",
    preview: "Yes — real crop overlay",
    cost: "Free (MIT)",
    ours: true,
  },
  { method: "Premiere / Photoshop", speed: "~3 min per file", privacy: "Local", preview: "Yes", cost: "Subscription" },
  { method: "Cloud crop tools", speed: "Upload-limited", privacy: "Cloud upload required", preview: "Varies", cost: "Freemium" },
  {
    method: "FFmpeg cropdetect scripts",
    speed: "Fast if scripted",
    privacy: "Local",
    preview: "No — CLI only",
    cost: "Free",
  },
];

export default function Comparison() {
  return (
    <Chapter tone="paper" id="compare-tools" index="10" label="Compare options" labelledBy="compare-tools-title">
      <div className={classes.head}>
        <Title order={2} id="compare-tools-title" className={classes.title}>
          AutoCrop Pro vs manual editing, <Fade>cloud tools, and FFmpeg</Fade>
        </Title>
        <p className={classes.lead}>
          Choosing how to strip letterboxes from a large media folder comes down to speed, privacy, and control.
        </p>
      </div>

      <div
        className={classes.scroller}
        role="region"
        aria-label="Comparison of batch crop methods"
        tabIndex={0}
        data-reveal
      >
        <table className={classes.table}>
          <caption className={classes.caption}>
            Comparison of batch crop methods for removing black borders from images and videos
          </caption>
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Batch speed</th>
              <th scope="col">Privacy</th>
              <th scope="col">Live preview</th>
              <th scope="col">Cost</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.method} data-ours={row.ours || undefined}>
                <th scope="row" className={classes.method}>
                  {row.ours && <span className={classes.dot} aria-hidden="true" />}
                  {row.method}
                  {row.ours && <span className={classes.sr}>{" (ours)"}</span>}
                </th>
                <td>{row.speed}</td>
                <td>{row.privacy}</td>
                <td>{row.preview}</td>
                <td>{row.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Chapter>
  );
}
