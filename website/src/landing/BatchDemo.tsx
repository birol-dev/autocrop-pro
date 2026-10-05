import { useEffect, useRef, useState } from "react";
import { Badge, Button, Group, Loader, Paper, Progress, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { ArrowClockwiseIcon, CheckCircleIcon, PlayIcon } from "@phosphor-icons/react";

import { VERSION } from "../content/site";
import { Section } from "../components/Section";
import classes from "./BatchDemo.module.css";

type Tone = "info" | "system" | "success" | "warning";
type Job = { name: string; meta: string; time: number; logs: [string, Tone][] };

const JOBS: Job[] = [
  {
    name: "IMG_0412.JPG",
    meta: "4.2 MB · Image",
    time: 280,
    logs: [
      ["[INFO] Processing IMG_0412.JPG (1/4)", "info"],
      ["[RUST] Edge sweep — tolerance 20%", "system"],
      ["[RUST] Histogram: top=130px, bottom=130px", "info"],
      ["[OK] IMG_0412_cropped.png → lossless PNG", "success"],
    ],
  },
  {
    name: "VLOG_JUNE_2026.MP4",
    meta: "185 MB · Video",
    time: 750,
    logs: [
      ["[INFO] Processing VLOG_JUNE_2026.MP4 (2/4)", "info"],
      ["[FFMPEG] cropdetect on 30 frames…", "system"],
      ["[FFMPEG] crop=1920:800:0:130", "info"],
      ["[OK] VLOG_JUNE_2026_cropped.mp4 encoded", "success"],
    ],
  },
  {
    name: "SCREENSHOT_02.PNG",
    meta: "1.8 MB · Image",
    time: 180,
    logs: [
      ["[INFO] Processing SCREENSHOT_02.PNG (3/4)", "info"],
      ["[RUST] Solid border #000000 detected", "system"],
      ["[OK] SCREENSHOT_02_cropped.png written", "success"],
    ],
  },
  {
    name: "CLIP_REEL.MKV",
    meta: "420 MB · Video",
    time: 950,
    logs: [
      ["[INFO] Processing CLIP_REEL.MKV (4/4)", "info"],
      ["[FFMPEG] Letterboxes detected", "system"],
      ["[RUST] Rayon thread assigned", "info"],
      ["[OK] CLIP_REEL_cropped.mkv complete", "success"],
    ],
  },
];

type Status = "queued" | "processing" | "done";
type Row = { pct: number; status: Status };
type LogLine = { id: number; text: string; tone: Tone };

const IDLE_ROWS: Row[] = JOBS.map(() => ({ pct: 0, status: "queued" }));
const IDLE_LOG: LogLine[] = [{ id: 0, text: "Rust core ready. Awaiting trigger...", tone: "info" }];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const STATUS_LABEL: Record<Status, string> = { queued: "Queued", processing: "Processing", done: "Done" };

export default function BatchDemo() {
  const [rows, setRows] = useState<Row[]>(IDLE_ROWS);
  const [log, setLog] = useState<LogLine[]>(IDLE_LOG);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const nextId = useRef(1);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight });
  }, [log]);

  const push = (text: string, tone: Tone) => setLog((l) => [...l, { id: nextId.current++, text, tone }]);
  const patch = (i: number, p: Partial<Row>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...p } : row)));

  async function run() {
    setRunning(true);
    setRows(IDLE_ROWS);
    setLog([]);

    push(`AutoCrop Pro Rust core v${VERSION}`, "system");
    await sleep(150);
    push("Spawning Rayon worker threads…", "info");
    await sleep(200);
    push("Output: Documents/AutoCrop_Output/", "warning");

    const t0 = performance.now();
    for (let i = 0; i < JOBS.length; i++) {
      const job = JOBS[i];
      if (!alive.current) return;
      patch(i, { status: "processing" });
      job.logs.slice(0, 2).forEach(([t, tone]) => push(t, tone));

      for (let step = 1; step <= 10; step++) {
        await sleep(job.time / 10);
        if (!alive.current) return;
        patch(i, { pct: step * 10 });
      }

      job.logs.slice(2).forEach(([t, tone]) => push(t, tone));
      patch(i, { status: "done" });
      await sleep(120);
    }

    push(`Batch complete — ${JOBS.length} files in ${((performance.now() - t0) / 1000).toFixed(2)}s`, "success");
    if (!alive.current) return;
    setRunning(false);
    setRan(true);
  }

  return (
    <Section id="batch" tint labelledBy="batch-title">
      <div className={classes.grid}>
        <Stack gap="md" data-reveal>
          <Badge variant="light" size="lg" tt="uppercase" w="fit-content" style={{ letterSpacing: "0.08em", fontSize: 11 }}>
            Live demo
          </Badge>
          <Title order={2} id="batch-title" style={{ letterSpacing: "-0.025em", textWrap: "balance" }}>
            Watch Rust chew through a batch
          </Title>
          <Text c="dimmed" fz="lg" lh={1.6}>
            Hit simulate to see how the backend queues files, spawns FFmpeg for video, and reports progress in real time.
          </Text>

          <Button
            size="md"
            w="fit-content"
            onClick={run}
            loading={running}
            leftSection={ran ? <ArrowClockwiseIcon size={18} weight="bold" /> : <PlayIcon size={18} weight="fill" />}
            aria-label="Simulate batch crop processing"
          >
            {running ? "Processing…" : ran ? "Run again" : "Run batch simulation"}
          </Button>

          <Stack gap="xs" mt="xs" aria-label="Simulated file queue">
            {JOBS.map((job, i) => {
              const row = rows[i];
              return (
                <Paper key={job.name} withBorder p="sm" radius="md">
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <div style={{ minWidth: 0 }}>
                      <Text fw={650} fz="sm" truncate>
                        {job.name}
                      </Text>
                      <Text fz="xs" c="dimmed">
                        {job.meta}
                      </Text>
                    </div>
                    <Group gap="sm" wrap="nowrap">
                      <Text fz="xs" fw={600} w={34} ta="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {row.pct}%
                      </Text>
                      <Badge
                        w={104}
                        variant="light"
                        color={row.status === "done" ? "teal" : row.status === "processing" ? "brand" : "gray"}
                        leftSection={
                          row.status === "done" ? (
                            <CheckCircleIcon size={12} weight="fill" />
                          ) : row.status === "processing" ? (
                            <Loader size={10} color="brand" />
                          ) : undefined
                        }
                      >
                        {STATUS_LABEL[row.status]}
                      </Badge>
                    </Group>
                  </Group>
                  <Progress
                    value={row.pct}
                    size="xs"
                    mt={8}
                    color={row.status === "done" ? "teal" : "brand"}
                    aria-label={`${job.name} progress`}
                  />
                </Paper>
              );
            })}
          </Stack>
        </Stack>

        <Paper className={classes.terminal} radius="lg" data-reveal>
          <div className={classes.termBar}>
            <span className={classes.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <Text size="xs" fw={600} c="gray.5">
              Rust backend logs
            </Text>
          </div>
          <ScrollArea h={{ base: 300, md: 520 }} viewportRef={viewport} type="auto" scrollbarSize={8}>
            <div className={classes.logBody} role="log" aria-live="polite">
              {log.map((line) => (
                <div key={line.id} className={classes.line} data-tone={line.tone}>
                  &gt; {line.text}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Paper>
      </div>
    </Section>
  );
}
