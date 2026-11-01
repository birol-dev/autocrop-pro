import { Title } from "@mantine/core";

import { Chapter, Fade } from "../components/Section";
import classes from "./Pain.module.css";

type Pain = {
  title: string;
  quote: string;
  body: string;
  from: [string, string];
  to: [string, string];
};

const PAINS: Pain[] = [
  {
    title: "The Premiere trap",
    quote: "I just need to strip letterboxes — not open a full timeline for each clip.",
    body: "Import, crop, export, repeat. For a folder of screen recordings or VHS rips, that's an afternoon gone. AutoCrop Pro processes the whole folder while you grab coffee.",
    from: ["~3 min", "per file manually"],
    to: ["<1 sec", "each in batch"],
  },
  {
    title: "The upload you can't afford",
    quote: "My client's NDA footage is not going to a cloud cropper.",
    body: "Cloud croppers want gigabytes uploaded over Wi-Fi. Slow, lossy, and a security nightmare for sensitive media. AutoCrop Pro crops in your browser tab or on your PC — files never go to our servers.",
    from: ["0 bytes", "uploaded"],
    to: ["100%", "local"],
  },
  {
    title: "The FFmpeg gamble",
    quote: "I know cropdetect works — I just don't trust myself with 400 files.",
    body: "One wrong flag in a batch script and you've re-encoded an archive with artifacts. AutoCrop Pro gives you FFmpeg's power with a visual preview before you commit.",
    from: ["CLI risk", "batch scripts"],
    to: ["Visual control", "live preview"],
  },
  {
    title: "The quality death spiral",
    quote: "I cropped it twice and now it looks like a potato.",
    body: "Every re-encode through a web tool adds compression damage. AutoCrop Pro offers lossless PNG output or copies the original wrapper. Crop once, crop right.",
    from: ["Lossless PNG", "zero artifacts"],
    to: ["Keep original", "no re-encode"],
  },
];

export default function PainSection() {
  return (
    <Chapter id="pain" tone="charcoal" index="02" label="The real problem" labelledBy="pain-title">
      <header className={classes.header}>
        <Title order={2} id="pain-title" className={classes.title}>
          Black bars aren&apos;t hard to crop. <Fade>Doing it 200 times is.</Fade>
        </Title>
        <p className={classes.lead}>
          Every editor, archivist, and content team hits the same wall. The crop takes seconds — the workflow around it
          eats your week.
        </p>
      </header>

      <ul className={classes.rows}>
        {PAINS.map((p) => (
          <li key={p.title} className={classes.row} data-reveal>
            <div className={classes.what}>
              <Title order={3}>{p.title}</Title>
              <p className={classes.quote}>&ldquo;{p.quote}&rdquo;</p>
            </div>

            <p className={classes.body}>{p.body}</p>

            <div className={classes.stat}>
              <span className={classes.measure}>
                <span className={classes.value}>{p.from[0]}</span>
                <span className={classes.label}>{p.from[1]}</span>
              </span>
              <span className={classes.arrow} aria-hidden="true">
                &rarr;
              </span>
              <span className={classes.measure}>
                <span className={classes.value}>{p.to[0]}</span>
                <span className={classes.label}>{p.to[1]}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}
