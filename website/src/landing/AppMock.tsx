import { MEDIA } from "../content/media";
import classes from "./AppMock.module.css";

const ITEMS = [
  { name: "coast-reel.mp4", src: MEDIA.coast.src, meta: "1920 × 800", detect: true },
  { name: "desert-road.jpg", src: MEDIA.road.src, meta: "1600 × 660" },
  { name: "alpine-lake.png", src: MEDIA.lake.src, meta: "1600 × 900" },
  { name: "wheat-fields.webp", src: MEDIA.fields.src, meta: "1600 × 900" },
];

const NAV = ["Queue", "Outputs", "Settings"];

/** A static, non-interactive picture of the desktop app's queue screen. */
export default function AppMock() {
  return (
    <div className={classes.window} aria-hidden="true" inert>
      <div className={classes.chrome}>
        <span className={classes.dots}>
          <i />
          <i />
          <i />
        </span>
        <span>AutoCrop Pro</span>
        <span className={classes.nav}>
          {NAV.map((label, i) => (
            <span key={label} className={classes.navItem} data-active={i === 0 || undefined}>
              {label}
            </span>
          ))}
        </span>
      </div>

      <div className={classes.body}>
        <div className={classes.main}>
          <p className={classes.heading}>
            <span>Queue</span>
            <span className={classes.grey}>4 files ready to process</span>
          </p>

          <div className={classes.grid}>
            {ITEMS.map((item) => (
              <div key={item.name}>
                <div className={classes.thumb}>
                  <img src={item.src} alt="" loading="lazy" decoding="async" />
                  {item.detect && <div className={classes.crop} />}
                </div>
                <p className={classes.name}>{item.name}</p>
                <p className={classes.grey}>{item.meta}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={classes.aside}>
          <p className={classes.heading}>Export settings</p>

          <div className={classes.field}>
            <p className={classes.row}>
              <span>Detection tolerance</span>
              <span className={classes.grey}>20%</span>
            </p>
            <span className={classes.track}>
              <span className={classes.fill} />
            </span>
          </div>

          <div className={classes.field}>
            <span>Output format</span>
            <span className={classes.select}>Same as source</span>
          </div>

          <p className={classes.row}>
            <span>10px padding</span>
            <span className={classes.toggle} />
          </p>

          <span className={classes.process}>Process 4 files</span>
        </div>
      </div>
    </div>
  );
}
