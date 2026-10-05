import { useState } from "react";
import { Anchor, Badge, Group, Paper, Slider, Stack, Text, Title } from "@mantine/core";
import { CheckCircleIcon, CrosshairSimpleIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react";

import Scene from "../components/Scene";
import { Section } from "../components/Section";
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
      box: { top: 12, left: 0, width: 100, height: 76 },
      w: 1920,
      h: 800,
      detail: "Exact borders detected",
      verdict: "Optimal sweep",
      tone: "ok",
    };
  }
  const scale = (tolerance - 45) / 55;
  const indentY = 12 + scale * 25;
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

const TONE = {
  idle: { color: "gray", icon: CrosshairSimpleIcon },
  ok: { color: "teal", icon: CheckCircleIcon },
  warn: { color: "yellow", icon: WarningIcon },
  danger: { color: "red", icon: XCircleIcon },
} as const;

export default function Simulator() {
  const [tolerance, setTolerance] = useState(20);
  const sim = simulate(tolerance);
  const tone = TONE[sim.tone];
  const ToneIcon = tone.icon;

  return (
    <Section id="simulator" labelledBy="sim-title">
      <div className={classes.grid}>
        <Stack gap="md" data-reveal>
          <Badge variant="light" size="lg" tt="uppercase" w="fit-content" style={{ letterSpacing: "0.08em", fontSize: 11 }}>
            Interactive demo
          </Badge>
          <Title order={2} id="sim-title" style={{ letterSpacing: "-0.025em", textWrap: "balance" }}>
            Try the crop tolerance slider
          </Title>
          <Text c="dimmed" fz="lg" lh={1.6}>
            Drag the slider to see how AutoCrop Pro sweeps pixel histograms inward from each edge. Below 13% misses
            borders. Above 45% clips into your content.
          </Text>
          <Text c="dimmed" fz="lg" lh={1.6}>
            <Anchor href="/cropper/" inherit fw={600}>
              Crop your own files in the browser
            </Anchor>{" "}
            — no install, files stay in this tab.
          </Text>
        </Stack>

        <Paper withBorder radius="xl" shadow="lg" className={classes.window} data-reveal>
          <div className={classes.bar}>
            <span className={classes.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <Text size="xs" c="dimmed" fw={600}>
              Crop Tolerance Playground
            </Text>
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

            <Group justify="space-between" mt="lg" mb={6}>
              <Text fw={650} component="label" id="tolerance-label">
                Tolerance
              </Text>
              <Badge size="lg" variant="light" color={tone.color} style={{ fontVariantNumeric: "tabular-nums" }}>
                {tolerance}%
              </Badge>
            </Group>

            <Slider
              value={tolerance}
              onChange={setTolerance}
              min={0}
              max={100}
              step={1}
              color={tone.color}
              label={null}
              marks={[
                { value: 13, label: "13%" },
                { value: 45, label: "45%" },
              ]}
              mb={30}
              thumbLabel="Crop tolerance"
              aria-labelledby="tolerance-label"
            />

            <Group justify="space-between" gap="xs" wrap="wrap">
              <Group gap={6} c="dimmed" wrap="nowrap" fz="sm" aria-live="polite">
                <ToneIcon size={16} weight="bold" />
                <span>{sim.detail}</span>
              </Group>
              <Badge variant="light" color={tone.color} size="md">
                {sim.verdict}
              </Badge>
            </Group>
          </div>
        </Paper>
      </div>
    </Section>
  );
}
