import { useState } from "react";
import { Slider, Title } from "@mantine/core";
import { CheckCircleIcon, CrosshairSimpleIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react";

import Scene from "../components/Scene";
import { Chapter, Fade } from "../components/Section";
import classes from "./Simulator.module.css";

type Tone = "idle" | "ok" | "warn" | "danger";

type Sim = {
  box: { top: number; left: number; width: number; height: number };
  w: number;
  h: number;
  detail: string;
  verdict: string;
  tone: Tone;
};

/** Below ~13% the letterbox is missed, 13–45% is the sweet spot, above that it eats into the picture. */
function simulate(tolerance: number): Sim {
  if (tolerance < 13) {
    return {
      box: { top: 0, left: 0, width: 100, height: 100 },
      w: 1920,
      h: 1080,
      detail: "Borders ignored — too conservative",
      verdict: "Tolerance too low",
      tone: "warn",
    };
  }
  if (tolerance <= 45) {
    return {
      box: { top: 13, left: 0, width: 100, height: 74 },
      w: 1920,
      h: 800,
      detail: "Exact borders detected",
      verdict: "Optimal sweep",
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
    detail: "Content clipped",
    verdict: "Too aggressive",
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
    <Chapter tone="white" id="simulator" index="07" label="Interactive demo" labelledBy="sim-title">
      <div className={classes.grid}>
        <div className={classes.copy} data-reveal>
          <Title order={2} id="sim-title" className={classes.title}>
            Try the crop <Fade>tolerance slider</Fade>
          </Title>
          <p className={classes.lead}>
            Drag the slider to see how AutoCrop Pro sweeps pixel histograms inward from each edge. Below 13% misses
            borders. Above 45% clips into your content.
          </p>
          <p className={classes.lead}>
            <a href="/cropper/" className={classes.link}>
              Crop your own files in the browser
            </a>{" "}
            — no install, files stay in this tab.
          </p>
        </div>

        <div className={classes.panel} data-reveal>
          <div className={classes.window}>
            <div className={classes.bar}>
              <span>Crop Tolerance Playground</span>
            </div>

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
                marks={[
                  { value: 13, label: "13%" },
                  { value: 45, label: "45%" },
                ]}
                thumbLabel="Crop tolerance"
                aria-labelledby="tolerance-label"
                classNames={{ markLabel: classes.markLabel }}
              />

              <div className={classes.status}>
                <span className={classes.detail} aria-live="polite">
                  <StateIcon size={16} weight="bold" aria-hidden="true" />
                  <span>{sim.detail}</span>
                </span>
                <span className={classes.verdict}>{sim.verdict}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
