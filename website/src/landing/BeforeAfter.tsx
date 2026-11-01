import { useState } from "react";
import { Title } from "@mantine/core";

import Scene, { SCENE } from "../components/Scene";
import { Chapter, Fade, Margins } from "../components/Section";
import classes from "./BeforeAfter.module.css";

// Where the picture sits inside the 16:9 frame, as a percentage.
const PICTURE_TOP = (SCENE.bar / SCENE.h) * 100;
const PICTURE_HEIGHT = ((SCENE.h - SCENE.bar * 2) / SCENE.h) * 100;

export default function BeforeAfter() {
  const [pos, setPos] = useState(50);

  return (
    <Chapter id="compare" tone="white" index="03" label="Before and after" labelledBy="compare-title" bleed>
      <Margins>
        <header className={classes.header}>
          <Title order={2} id="compare-title">
            See what one <Fade>batch run looks like</Fade>
          </Title>
        </header>
      </Margins>

      <div className={classes.frame} style={{ ["--pos" as string]: `${pos}%` }} data-reveal>
        {/* Before: the full frame with its black bars. */}
        <div className={classes.layer}>
          <Scene mode="full" />
        </div>

        {/* After: bars removed (checkerboard = gone), revealed to the right of the handle. */}
        <div className={`${classes.layer} ${classes.after}`}>
          <div className={classes.picture} style={{ top: `${PICTURE_TOP}%`, height: `${PICTURE_HEIGHT}%` }}>
            <Scene mode="cropped" />
          </div>
        </div>

        <input
          type="range"
          className={classes.range}
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.currentTarget.value))}
          aria-label="Drag to compare before and after crop"
        />

        <div className={classes.handle} aria-hidden="true">
          <span className={classes.knob} />
        </div>
      </div>

      <Margins>
        <div className={classes.captions}>
          <span>Before: 1920×1080 with letterboxes</span>
          <span>After: 1920×800 clean frame</span>
        </div>
        <p className={classes.hint}>Drag the handle — or focus it and use the arrow keys</p>
      </Margins>
    </Chapter>
  );
}
