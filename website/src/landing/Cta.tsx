import { Title } from "@mantine/core";

import { MEDIA } from "../content/media";
import { RELEASES_URL } from "../content/site";
import { Chapter, Fade, MediaFrame, Pill } from "../components/Section";
import classes from "./Cta.module.css";

export default function Cta() {
  return (
    <Chapter tone="black" id="download" labelledBy="cta-title" className={classes.chapter}>
      <div className={classes.copy} data-reveal>
        <Title order={2} id="cta-title" className={classes.title}>
          Your folder of letterboxed clips <Fade>shouldn&apos;t own your afternoon</Fade>
        </Title>
        <p className={classes.lead}>
          Crop a few files in your browser, or download AutoCrop Pro for Windows. Drop your files. Get back to actual
          creative work.
        </p>
        <div className={classes.actions}>
          <Pill href="/cropper/" size="lg">
            Crop in your browser
          </Pill>
          <Pill href={RELEASES_URL} size="lg" variant="soft">
            Download the Windows app
          </Pill>
        </div>
        <p className={classes.note}>
          No account. No subscription. MIT license. · Browser cropper on any OS · Native app for Windows 10/11
        </p>
      </div>

      <div className={classes.frames} aria-hidden="true">
        <MediaFrame
          src={MEDIA.harbor.src}
          alt={MEDIA.harbor.alt}
          ratio={MEDIA.harbor.ratio}
          tilt={7}
          className={`${classes.frame} ${classes.frameA}`}
        />
        <MediaFrame
          src={MEDIA.rooftops.src}
          alt={MEDIA.rooftops.alt}
          ratio={MEDIA.rooftops.ratio}
          tilt={-6}
          className={`${classes.frame} ${classes.frameB}`}
        />
        <MediaFrame
          src={MEDIA.lake.src}
          alt={MEDIA.lake.alt}
          ratio={MEDIA.lake.ratio}
          tilt={8}
          className={`${classes.frame} ${classes.frameC}`}
        />
      </div>
    </Chapter>
  );
}
