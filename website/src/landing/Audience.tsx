import { Title } from "@mantine/core";

import { MEDIA } from "../content/media";
import { Chapter, Fade, Margins, MediaFrame } from "../components/Section";
import classes from "./Audience.module.css";

const PERSONAS = [
  {
    title: "YouTube & video editors",
    body: "Standardize mixed-aspect footage, screen recordings, and old TV rips without opening a timeline for each clip.",
    media: MEDIA.harbor,
  },
  {
    title: "Designers & photographers",
    body: "Batch-strip scanner borders and black margins from product shots, mockups, and web assets.",
    media: MEDIA.rooftops,
  },
  {
    title: "Archivists & hobbyists",
    body: "Digitizing VHS, DVD, or scanned collections? Remove thick analog borders from hundreds of files overnight.",
    media: MEDIA.orchard,
  },
  {
    title: "Agencies with NDA clients",
    body: "Sensitive footage stays on your machine. Crop in the tab or in the Windows app — no third-party cloud uploads.",
    media: MEDIA.lake,
  },
];

export default function Audience() {
  return (
    <Chapter tone="paper" index="06" label="Who it's for" labelledBy="audience-title" flushTop bleed>
      <Margins>
        <header className={classes.header}>
          <Title order={2} id="audience-title" className={classes.title}>
            Built for people who process media <Fade>in bulk</Fade>
          </Title>
        </header>
      </Margins>

      <div className={classes.scroller} tabIndex={0} role="region" aria-label="Who AutoCrop Pro is for" data-reveal>
        <ul className={classes.track}>
          {PERSONAS.map((p) => (
            <li key={p.title} className={classes.item}>
              <MediaFrame src={p.media.src} alt={p.media.alt} ratio="3 / 4" />
              <div className={classes.text}>
                <Title order={3}>{p.title}</Title>
                <p className={classes.body}>{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}
