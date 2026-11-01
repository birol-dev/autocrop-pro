import { useEffect, useRef, useState } from "react";
import { Loader, ScrollArea, Title } from "@mantine/core";
import { ArrowClockwiseIcon, PlayIcon } from "@phosphor-icons/react";

import { VERSION } from "../content/site";
import { Chapter, Fade, Pill } from "../components/Section";
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
      ["[RUST] Histogram: top=140px, bottom=140px", "info"],
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
      ["[FFMPEG] crop=1920:800:0:140", "info"],
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
    <Chapter tone="charcoal" id="batch" index="08" label="Live demo" labelledBy="batch-title">
      <div className={classes.grid}>
        <div className={classes.copy} data-reveal>
          <Title order={2} id="batch-title" className={classes.title}>
            Watch Rust <Fade>chew through a batch</Fade>
          </Title>
          <p className={classes.lead}>
            Hit simulate to see how the backend queues files, spawns FFmpeg for video, and reports progress in real time.
          </p>

          <Pill
            onClick={run}
            disabled={running}
            aria-label="Simulate batch crop processing"
            icon={
              running ? (
                <Loader size={16} color="currentColor" />
              ) : ran ? (
                <ArrowClockwiseIcon size={18} weight="bold" />
              ) : (
                <PlayIcon size={18} weight="fill" />
              )
            }
          >
            {running ? "Processing…" : ran ? "Run again" : "Run batch simulation"}
          </Pill>
        </div>

        <ol className={classes.queue} aria-label="Simulated file queue" data-reveal>
          {JOBS.map((job, i) => {
            const row = rows[i];
            return (
              <li key={job.name} className={classes.row}>
                <div className={classes.rowHead}>
                  <span className={classes.name}>{job.name}</span>
                  <span className={classes.pct}>{row.pct}%</span>
                </div>
                <div className={classes.rowMeta}>
                  <span>{job.meta}</span>
                  <span className={classes.status} data-status={row.status}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </div>
                <div
                  className={classes.track}
                  role="progressbar"
                  aria-label={`${job.name} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={row.pct}
                >
                  <span className={classes.fill} style={{ width: `${row.pct}%` }} />
                </div>
              </li>
            );
          })}
        </ol>

        <div className={classes.terminal} data-reveal>
          <div className={classes.termBar}>Rust backend logs</div>
          <ScrollArea h={{ base: 300, md: 440 }} viewportRef={viewport} type="auto" scrollbarSize={8}>
            <div className={classes.logBody} role="log" aria-live="polite">
              {log.map((line) => (
                <div key={line.id} className={classes.line} data-tone={line.tone}>
                  &gt; {line.text}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Chapter>
  );
}
