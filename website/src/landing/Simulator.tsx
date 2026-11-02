import { useState } from "react";
import { Slider, Title } from "@mantine/core";
import { CheckCircleIcon, CrosshairSimpleIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react";

import Scene from "../components/Scene";
import { Chapter, Fade, Pill } from "../components/Section";
import classes from "./Simulator.module.css";

type Tone = "idle" | "ok" | "warn" | "danger";

type Sim = {
  box: { top: number; left: number; width: number; height: number };
  w: number;
  h: number;
  detail: string;
  tone: Tone;
};

/** Below ~13% the letterbox is missed, 13–45% is the sweet spot, above that it eats into the picture. */
function simulate(tolerance: number): Sim {
  if (tolerance < 13) {
    return {
      box: { top: 0, left: 0, width: 100, height: 100 },
      w: 1920,
      h: 1080,
      detail: "Too low: misses the bars",
      tone: "warn",
    };
  }
  if (tolerance <= 45) {
    return {
      box: { top: 13, left: 0, width: 100, height: 74 },
      w: 1920,
      h: 800,
      detail: "Just right",
      tone: "ok",
    };
  }
  const scale = (tolerance - 45) / 55;
  const indentY = 13 + scale * 25;
  const indentX = scale * 30;
  const width = 100 - indentX * 2;
  const height = 100 - indentY * 2;
  return {
    box: { top: indentY, left: indentX, width, height },
    w: Math.round(1920 * (width / 100)),
    h: Math.round(1080 * (height / 100)),
    detail: "Too high: cuts into the picture",
    tone: "danger",
  };
}

const ICONS = {
  idle: CrosshairSimpleIcon,
  ok: CheckCircleIcon,
  warn: WarningIcon,
  danger: XCircleIcon,
} as const;

export default function Simulator() {
  const [tolerance, setTolerance] = useState(20);
  const sim = simulate(tolerance);
  const StateIcon = ICONS[sim.tone];

  return (
    <Chapter tone="paper" id="simulator" labelledBy="sim-title">
      <div className={classes.wrap}>
        <div className={classes.copy} data-reveal>
          <Title order={2} id="sim-title" className={classes.title}>
            One slider. <Fade>That&apos;s it.</Fade>
          </Title>
        </div>

        <div className={classes.window} data-reveal>
          <div className={classes.body}>
            <div className={classes.canvas} role="img" aria-label="Simulated widescreen image with letterbox borders">
              <Scene mode="full" />
              <div
                className={classes.box}
                data-tone={sim.tone}
                style={{
                  top: `${sim.box.top}%`,
                  left: `${sim.box.left}%`,
                  width: `${sim.box.width}%`,
                  height: `${sim.box.height}%`,
                }}
              >
                <span className={classes.handle} data-pos="tl" />
                <span className={classes.handle} data-pos="tr" />
                <span className={classes.handle} data-pos="bl" />
                <span className={classes.handle} data-pos="br" />
                <span className={classes.dims}>
                  {sim.w} × {sim.h}
                </span>
              </div>
            </div>

            <div className={classes.sliderHead}>
              <span className={classes.label} id="tolerance-label">
                Tolerance
              </span>
              <span className={classes.value}>{tolerance}%</span>
            </div>

            <Slider
              className={classes.slider}
              value={tolerance}
              onChange={setTolerance}
              min={0}
              max={100}
              step={1}
              color="var(--ink)"
              label={null}
              thumbLabel="Crop tolerance"
              aria-labelledby="tolerance-label"
            />

            <div className={classes.status}>
              <span className={classes.detail} aria-live="polite">
                <StateIcon size={16} weight="bold" aria-hidden="true" />
                <span>{sim.detail}</span>
              </span>
            </div>
          </div>
        </div>

        <Pill href="/cropper/" size="lg">
          Crop your own files
        </Pill>
      </div>
    </Chapter>
  );
}
