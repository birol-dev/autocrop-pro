import { CheckCircleIcon } from "@phosphor-icons/react";

import { MEDIA } from "../content/media";
import classes from "./AppWindow.module.css";

const FILES = [
  { name: "coast-reel.mp4", meta: "1920 × 1080", src: MEDIA.coast.src },
  { name: "desert-road.jpg", meta: "1600 × 900", src: MEDIA.road.src },
  { name: "wheat-fields.webp", meta: "1600 × 900", src: MEDIA.fields.src },
  { name: "harbour-clip.mov", meta: "1280 × 720", src: MEDIA.harbor.src },
  { name: "old-town.png", meta: "1600 × 900", src: MEDIA.rooftops.src },
  { name: "blossom.jpg", meta: "1200 × 900", src: MEDIA.orchard.src },
];

/**
 * A picture of the desktop app's queue, not a working copy. It reads the hero's
 * scroll progress (`--work`, `--crop`) to tick files off and pull the bars away.
 */
export default function AppWindow() {
  return (
    <div className={classes.window} aria-hidden="true" inert>
      <div className={classes.ui} style={{ ["--count" as string]: FILES.length }}>
        <div className={classes.titleBar}>
          <img className={classes.logo} src="/logo-icon.png" alt="" />
          <span className={classes.appName}>AutoCrop Pro</span>
          <span className={classes.tabs}>
            <span className={classes.tab} data-active>
              Queue
            </span>
            <span className={classes.tab}>Outputs</span>
            <span className={classes.tab}>Settings</span>
          </span>
          <span className={classes.count}>{FILES.length} files</span>
          <span className={classes.progress} />
        </div>

        <div className={classes.body}>
          <ul className={classes.queue}>
            {FILES.map((file, i) => (
              <li key={file.name} className={classes.row} data-active={i === 0 || undefined} style={{ ["--i" as string]: i }}>
                <span className={classes.thumb}>
                  <img src={file.src} alt="" loading="lazy" decoding="async" />
                  <span className={classes.thumbBar} data-edge="top" />
                  <span className={classes.thumbBar} data-edge="bottom" />
                </span>
                <span className={classes.fileText}>
                  <span className={classes.fileName}>{file.name}</span>
                  <span className={classes.fileMeta}>{file.meta}</span>
                </span>
                <CheckCircleIcon className={classes.check} weight="fill" />
              </li>
            ))}
          </ul>

          <div className={classes.detail}>
            <div className={classes.preview}>
              <img src={MEDIA.coast.src} alt="" loading="eager" decoding="async" />
              <span className={classes.bar} data-edge="top">
                <span className={classes.mark} data-side="left" />
                <span className={classes.mark} data-side="right" />
              </span>
              <span className={classes.bar} data-edge="bottom">
                <span className={classes.mark} data-side="left" />
                <span className={classes.mark} data-side="right" />
              </span>
            </div>

            <div className={classes.controls}>
              <div className={classes.setting}>
                <span className={classes.settingRow}>
                  <span>Detection tolerance</span>
                  <span className={classes.settingValue}>20%</span>
                </span>
                <span className={classes.track}>
                  <span className={classes.fill} />
                </span>
              </div>

              <span className={classes.action}>
                <span className={classes.actionIdle}>Process {FILES.length} files</span>
                <span className={classes.actionDone}>{FILES.length} files cropped</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
