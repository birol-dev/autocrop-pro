import { Title } from "@mantine/core";
import { WindowsLogoIcon } from "@phosphor-icons/react";

import { Fade, Pill } from "../components/Section";
import { useScrub } from "../components/useScrub";
import { MEDIA } from "../content/media";
import { RELEASES_URL } from "../content/site";
import AppWindow from "./AppWindow";
import classes from "./Hero.module.css";

/**
 * The headline sits in the sky of a landscape, with the app rising out of the
 * bottom of the screen. Scrolling lifts the window to the centre, plays a batch
 * through it, then lets dusk fall so the page runs on into the black section below.
 */
export default function Hero() {
  const track = useScrub<HTMLElement>();

  return (
    <section
      ref={track}
      id="hero"
      data-tone="black"
      data-mantine-color-scheme="dark"
      className={classes.track}
      aria-labelledby="hero-title"
    >
      <div className={classes.stage}>
        <img className={classes.photo} src={MEDIA.lake.src} alt={MEDIA.lake.alt} loading="eager" decoding="async" />
        <div className={classes.veil} aria-hidden="true" />
        <div className={classes.night} aria-hidden="true" />

        <div className={classes.copy}>
          <Title order={1} id="hero-title" className={classes.title}>
            Drop a folder.
            <br />
            <Fade>Lose the black bars.</Fade>
          </Title>
          <p className={classes.note}>Removes black bars from photos and videos. Free and private.</p>
          <div className={classes.pills}>
            <Pill href="/cropper/" size="lg">
              Crop in your browser
            </Pill>
            <Pill
              href={RELEASES_URL}
              size="lg"
              variant="soft"
              className={classes.glass}
              icon={<WindowsLogoIcon size={16} weight="fill" />}
            >
              Download for Windows
            </Pill>
          </div>
        </div>

        <div className={classes.window}>
          <AppWindow />
        </div>
      </div>
    </section>
  );
}
