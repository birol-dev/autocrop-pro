import type { ReactNode } from "react";
import { Title } from "@mantine/core";

import { Chapter, Fade } from "../components/Section";
import classes from "./Steps.module.css";

type Step = { title: string; body: ReactNode };

const STEPS: Step[] = [
  {
    title: "Drop your files",
    body: "Drag a folder of JPG, PNG, WEBP, MP4, MOV, MKV, or any supported format onto the app. Hundreds at once.",
  },
  {
    title: "Preview & tune",
    body: "Click any file to see the crop overlay. Adjust tolerance until borders snap perfectly — without touching pixel math.",
  },
  {
    title: "Batch export",
    body: (
      <>
        Hit process. Cropped files land in <code className={classes.path}>Documents/AutoCrop_Output/</code>. Originals
        stay untouched.
      </>
    ),
  },
];

export default function Steps() {
  return (
    <Chapter id="how-it-works" tone="paper" index="05" label="Workflow" labelledBy="how-title">
      <header className={classes.header}>
        <Title order={2} id="how-title">
          Three steps. <Fade>No learning curve.</Fade>
        </Title>
        <p className={classes.lead}>
          Same flow in the{" "}
          <a href="/cropper/" className={classes.link}>
            browser cropper
          </a>{" "}
          or the Windows app. The app is built for hundreds of files at once.
        </p>
      </header>

      <ol className={classes.track}>
        {STEPS.map((step, i) => (
          <li key={step.title} className={classes.step} data-reveal>
            <span className={classes.numeral} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={classes.content}>
              <Title order={3}>{step.title}</Title>
              <p className={classes.body}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Chapter>
  );
}
