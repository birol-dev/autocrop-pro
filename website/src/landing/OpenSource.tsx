import { Title } from "@mantine/core";
import { ArrowUpRightIcon } from "@phosphor-icons/react";

import { GITHUB_URL, RELEASES_URL } from "../content/site";
import { Chapter, Fade } from "../components/Section";
import classes from "./OpenSource.module.css";

const POINTS = [
  "Full source code public on GitHub",
  "MIT License — use it commercially, modify freely",
  "Built with Rust + Tauri — no hidden telemetry",
];

export default function OpenSource() {
  return (
    <Chapter tone="white" id="open-source" index="09" label="Open source" labelledBy="oss-title">
      <div className={classes.grid}>
        <div className={classes.copy} data-reveal>
          <Title order={2} id="oss-title" className={classes.title}>
            Free forever. <Fade>Inspect everything.</Fade>
          </Title>
          <p className={classes.lead}>
            No subscriptions, no license keys, no black-box uploads. AutoCrop Pro is MIT-licensed — read the Rust backend
            on GitHub, fork it, contribute fixes, and ship your own builds.
          </p>
          <ul className={classes.points}>
            {POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className={classes.mark} data-reveal>
          <span className={classes.glow} aria-hidden="true" />
          <img className={classes.logo} src="/logo-app.png" alt="AutoCrop Pro app icon" width={220} height={220} />
        </div>

        <div className={classes.actions} data-reveal>
          <a className={classes.action} href={GITHUB_URL}>
            <span>View source on GitHub</span>
            <ArrowUpRightIcon size={26} weight="light" aria-hidden="true" />
          </a>
          <a className={classes.action} href={RELEASES_URL}>
            <span>Download latest release</span>
            <ArrowUpRightIcon size={26} weight="light" aria-hidden="true" />
          </a>
          <p className={classes.note}>MIT licensed · Windows 10/11</p>
        </div>
      </div>
    </Chapter>
  );
}
