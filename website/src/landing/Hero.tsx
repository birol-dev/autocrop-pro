import { Title } from "@mantine/core";
import { WindowsLogoIcon } from "@phosphor-icons/react";

import { Fade, Pill } from "../components/Section";
import { HERO_VIDEO, MEDIA } from "../content/media";
import { RELEASES_URL } from "../content/site";
import classes from "./Hero.module.css";

export default function Hero() {
  return (
    <section
      id="hero"
      data-tone="black"
      data-mantine-color-scheme="dark"
      className={classes.hero}
      aria-labelledby="hero-title"
    >
      <div className={classes.topBar} />

      <div className={classes.stage}>
        <div className={classes.picture}>
          <div className={classes.mediaWrap}>
            {HERO_VIDEO ? (
              <video
                className={classes.media}
                src={HERO_VIDEO}
                poster={MEDIA.coast.src}
                muted
                playsInline
                autoPlay
                loop
                aria-hidden="true"
              />
            ) : (
              <img
                className={classes.media}
                src={MEDIA.coast.src}
                alt={MEDIA.coast.alt}
                loading="eager"
                decoding="async"
              />
            )}
          </div>

          <div className={classes.brackets} aria-hidden="true">
            <span className={`${classes.bracket} ${classes.topLeft}`} />
            <span className={`${classes.bracket} ${classes.topRight}`} />
            <span className={`${classes.bracket} ${classes.bottomLeft}`} />
            <span className={`${classes.bracket} ${classes.bottomRight}`} />
          </div>
        </div>
      </div>

      <div className={classes.bottomBar}>
        <div className={classes.grid}>
          <Title order={1} id="hero-title" className={classes.title}>
            Strip letterboxes from 500 files.{" "}
            <br />
            <Fade>No uploads. No scripts.</Fade>
          </Title>

          <div className={classes.actions}>
            <p className={classes.note}>
              Crop a few files in your browser, or download the Windows app for huge offline batches.
            </p>
            <div className={classes.pills}>
              <Pill href="/cropper/">Crop in your browser</Pill>
              <Pill
                href={RELEASES_URL}
                variant="soft"
                icon={<WindowsLogoIcon size={16} weight="fill" />}
              >
                Download for Windows
              </Pill>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
