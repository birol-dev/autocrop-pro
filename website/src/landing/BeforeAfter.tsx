import { useState } from "react";
import { Badge, Group, Paper, Text } from "@mantine/core";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

import Scene, { SCENE } from "../components/Scene";
import { Section, SectionHeader } from "../components/Section";
import classes from "./BeforeAfter.module.css";

// Where the picture sits inside the 16:9 frame, as a percentage.
const PICTURE_TOP = (SCENE.bar / SCENE.h) * 100;
const PICTURE_HEIGHT = ((SCENE.h - SCENE.bar * 2) / SCENE.h) * 100;

export default function BeforeAfter() {
  const [pos, setPos] = useState(50);

  return (
    <Section id="compare" labelledBy="compare-title">
      <SectionHeader eyebrow="Before & after" titleId="compare-title" title="See what one batch run looks like" />

      <Paper withBorder radius="xl" p={{ base: 8, sm: 12 }} maw={960} mx="auto" shadow="md" data-reveal>
        <div className={classes.frame} style={{ ["--pos" as string]: `${pos}%` }}>
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

          <Badge className={classes.tagBefore} color="dark" variant="filled" size="lg">
            Before — 1920×1080 with letterboxes
          </Badge>
          <Badge className={classes.tagAfter} color="brand" variant="filled" size="lg">
            After — 1920×800 clean frame
          </Badge>

          <div className={classes.handle} aria-hidden="true">
            <span className={classes.knob}>
              <CaretLeftIcon size={14} weight="bold" />
              <CaretRightIcon size={14} weight="bold" />
            </span>
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
        </div>

        <Group justify="center" mt="sm" gap={6} c="dimmed">
          <Text size="xs">Drag the handle — or focus it and use the arrow keys</Text>
        </Group>
      </Paper>
    </Section>
  );
}
