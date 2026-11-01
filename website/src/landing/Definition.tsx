import { Title } from "@mantine/core";

import { Chapter, Fade } from "../components/Section";
import { GITHUB_URL, LAST_UPDATED } from "../content/site";
import AppMock from "./AppMock";
import classes from "./Definition.module.css";

export default function Definition() {
  return (
    <Chapter id="what-is-autocrop" tone="paper" index="01" label="What it is" labelledBy="what-is-title" flushTop>
      <div className={classes.grid} data-reveal>
        <Title order={2} id="what-is-title">
          What is <Fade>AutoCrop Pro?</Fade>
        </Title>

        <div>
          <p className={classes.statement}>
            AutoCrop Pro automatically detects and removes black borders, letterboxes, and pillarboxes from images and
            videos. Crop a handful of files <a href="/cropper/">in your browser</a> (nothing is uploaded to our
            servers), or use the free Windows app for 500+ file batches with a Rust parallel backend and FFmpeg{" "}
            <code className={classes.code}>cropdetect</code>.
          </p>
          <p className={classes.meta}>
            <span>Last updated: {LAST_UPDATED}</span>
            <span>MIT License</span>
            <a href={GITHUB_URL}>Source on GitHub</a>
          </p>
        </div>
      </div>

      <div className={classes.panel} data-reveal>
        <AppMock />
      </div>
    </Chapter>
  );
}
