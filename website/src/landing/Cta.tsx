import { Title } from "@mantine/core";

import { useScrub } from "../components/useScrub";
import { MEDIA } from "../content/media";
import { RELEASES_URL } from "../content/site";
import { Chapter, Fade, MediaFrame, Pill } from "../components/Section";
import classes from "./Cta.module.css";

export default function Cta() {
  const scene = useScrub<HTMLDivElement>("view");

  return (
    <Chapter tone="black" id="download" labelledBy="cta-title" className={classes.chapter}>
      <div ref={scene} className={classes.scene}>
        <div className={classes.frames} aria-hidden="true">
          <MediaFrame
            src={MEDIA.harbor.src}
            alt=""
            ratio="3 / 4"
            tilt={-7}
            className={`${classes.frame} ${classes.frameA}`}
          />
          <MediaFrame src={MEDIA.fields.src} alt="" ratio="3 / 4" className={`${classes.frame} ${classes.frameB}`} />
          <MediaFrame
            src={MEDIA.rooftops.src}
            alt=""
            ratio="3 / 4"
            tilt={7}
            className={`${classes.frame} ${classes.frameC}`}
          />
        </div>

        <div className={classes.copy}>
          <Title order={2} id="cta-title" className={classes.title}>
            Get your afternoon <Fade>back.</Fade>
          </Title>
          <div className={classes.actions}>
            <Pill href="/cropper/" size="lg">
              Crop in your browser
            </Pill>
            <Pill href={RELEASES_URL} size="lg" variant="soft">
              Download for Windows
            </Pill>
          </div>
          <p className={classes.note}>Free. No account.</p>
        </div>
      </div>
    </Chapter>
  );
}
