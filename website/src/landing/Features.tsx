import { Title } from "@mantine/core";

import { MEDIA } from "../content/media";
import { Chapter, Fade, MediaFrame } from "../components/Section";
import classes from "./Features.module.css";

type Overlay = "brackets" | "scan" | "padding" | "queue" | "stack" | "grid";

type Feature = {
  title: string;
  body: string;
  media: { src: string; alt: string; ratio: string };
  overlay: Overlay;
};

const FEATURES: Feature[] = [
  {
    title: "Parallel batch processing",
    body: "Rayon distributes work across every CPU core. Drop 500 files, click process, and watch them fly through the queue.",
    media: MEDIA.road,
    overlay: "queue",
  },
  {
    title: "Dual edge detectors",
    body: "Images get pixel histogram sweeps with a 1% noise floor. Videos run FFmpeg cropdetect across 30 sample frames for accurate widescreen boundaries.",
    media: MEDIA.orchard,
    overlay: "scan",
  },
  {
    title: "Live preview overlay",
    body: "Click any queued file to see the detected crop region. Drag the tolerance slider and watch boundaries update in real time.",
    media: MEDIA.lake,
    overlay: "brackets",
  },
  {
    title: "Safe border padding",
    body: "Toggle a 10px buffer so the detector never clips subtitles, captions, or edge content you want to keep.",
    media: MEDIA.rooftops,
    overlay: "padding",
  },
  {
    title: "Flexible output formats",
    body: "Export lossless PNG for design assets, compressed JPEG or WebP for web, or keep the original file wrapper untouched.",
    media: MEDIA.fields,
    overlay: "stack",
  },
  {
    title: "Output gallery built in",
    body: "After processing, browse cropped files in a lightbox gallery. Open the output folder with one click.",
    media: MEDIA.harbor,
    overlay: "grid",
  },
];

export default function Features() {
  return (
    <Chapter id="features" tone="white" index="04" label="Under the hood" labelledBy="features-title" flushTop>
      <header className={classes.header}>
        <Title order={2} id="features-title">
          Built for speed, precision, <Fade>and privacy</Fade>
        </Title>
        <p className={classes.lead}>
          Rust parallel processing on the backend. A visual dashboard on the front. No compromises.
        </p>
      </header>

      <div className={classes.gallery}>
        {FEATURES.map((f) => (
          <article key={f.title} className={classes.item} data-reveal>
            <MediaFrame src={f.media.src} alt={f.media.alt} ratio={f.media.ratio}>
              <span className={`${classes.overlay} ${classes[f.overlay]}`} aria-hidden="true" />
            </MediaFrame>
            <div className={classes.text}>
              <Title order={3}>{f.title}</Title>
              <p className={classes.body}>{f.body}</p>
            </div>
          </article>
        ))}
      </div>
    </Chapter>
  );
}
