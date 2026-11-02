import { Title, Tooltip } from "@mantine/core";
import { FolderPlusIcon, TrashIcon } from "@phosphor-icons/react";
import CropStage from "@app/components/workbench/CropStage";
import ExportControls from "@app/components/workbench/ExportControls";
import QueueRow, { type RowState } from "@app/components/workbench/QueueRow";
import { WindowBar, summarize, workbench } from "@app/components/workbench/Workbench";

import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { Fade } from "../components/Section";
import { MEDIA } from "../content/media";
import { RELEASES_URL } from "../content/site";
import CropDropzone, { useFolderPicker } from "./components/CropDropzone";
import ResultsList from "./components/ResultsList";
import { displayedCrop, useCropper, type CropperTab } from "./useCropper";
import type { Item, OutputFormat } from "./types";
import { formatBytes } from "./utils";
import classes from "./CropperPage.module.css";

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "same", label: "Same as source" },
  { value: "png", label: "PNG (lossless)" },
  { value: "jpg", label: "JPEG (smaller)" },
  { value: "webp", label: "WebP" },
];

function rowState(item: Item): RowState {
  if (item.status === "detecting" || item.status === "processing") return "busy";
  if (item.status === "error") return "error";
  if (item.status === "ready" || item.status === "done") return "ready";
  return "idle";
}

function rowMeta(item: Item): string {
  const ext = item.name.split(".").pop()?.toUpperCase();
  const parts = [item.type === "video" ? "Video" : "Image", ext, formatBytes(item.file.size)];
  if (item.risky) parts.push("may need the Windows app");
  else if (item.oversized) parts.push("over 80 MB");
  return parts.filter(Boolean).join(" · ");
}

export default function CropperPage() {
  const c = useCropper();
  const { input: folderInput, open: openFolder } = useFolderPicker(c.addFiles);
  const resultCount = c.items.filter((f) => f.resultBlob).length;
  const active = c.items.find((f) => f.id === c.activeId) ?? null;
  const known = active && active.naturalW > 0 && active.naturalH > 0;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader current="cropper" overHero />

      <main id="main" data-tone="black" data-mantine-color-scheme="dark" className={classes.page}>
        <div id="hero" className={classes.backdrop} aria-hidden="true">
          <img className={classes.photo} src={MEDIA.lake.src} alt="" loading="eager" decoding="async" />
          <div className={classes.veil} />
        </div>

        <div className={classes.copy}>
          <Title order={1} className={classes.title}>
            Crop your files. <Fade>They never leave this tab.</Fade>
          </Title>
        </div>

        <div className={`${workbench.window} ${classes.window}`}>
          <WindowBar<CropperTab>
            tabs={[
              { value: "queue", label: "Queue", count: c.items.length },
              { value: "results", label: "Results", count: resultCount },
            ]}
            active={c.tab}
            onChange={c.setTab}
            progress={c.progress.visible ? c.progress.ratio : null}
          >
            {c.items.length > 0 && <span className={classes.summary}>{summarize(c.items)}</span>}
          </WindowBar>

          {c.tab === "queue" && !active && (
            <CropDropzone
              disabled={c.processing}
              loadingSamples={c.loadingSamples}
              onFiles={c.addFiles}
              onSample={c.addSamples}
              onFolder={openFolder}
            />
          )}

          {c.tab === "queue" && active && (
            <div className={workbench.body}>
              <aside className={workbench.side}>
                <div className={workbench.sideHead}>
                  <CropDropzone compact disabled={c.processing} onFiles={c.addFiles} />
                  <div className={workbench.sideActions}>
                    <Tooltip label="Add a folder">
                      <button
                        type="button"
                        className={workbench.iconButton}
                        aria-label="Add a folder"
                        disabled={c.processing}
                        onClick={openFolder}
                      >
                        <FolderPlusIcon size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip label="Clear the queue">
                      <button
                        type="button"
                        className={workbench.iconButton}
                        aria-label="Clear the queue"
                        disabled={c.processing}
                        onClick={c.clearAll}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <ul className={workbench.rows}>
                  {c.items.map((f) => (
                    <QueueRow
                      key={f.id}
                      name={f.name}
                      meta={rowMeta(f)}
                      src={f.thumbnailUrl ?? f.previewUrl}
                      type={f.thumbnailUrl ? "image" : f.type}
                      active={f.id === active.id}
                      state={rowState(f)}
                      error={f.error}
                      disabled={c.processing}
                      onSelect={() => c.setPreviewId(f.id)}
                      onRemove={() => c.removeFile(f.id)}
                    />
                  ))}
                </ul>
              </aside>

              <section className={workbench.detail} aria-label="Preview and export">
                <CropStage
                  key={active.id}
                  src={active.thumbnailUrl ?? active.previewUrl}
                  type={active.thumbnailUrl ? "image" : active.type}
                  name={active.name}
                  crop={displayedCrop(active, c.options)}
                  pending={!active.crop && !active.error}
                  frame={known ? { w: active.naturalW, h: active.naturalH } : null}
                  error={active.error}
                />
                <ExportControls
                  tolerance={c.options.tolerance}
                  onTolerance={c.setTolerance}
                  format={c.options.outputFormat}
                  formats={FORMATS}
                  onFormat={c.setOutputFormat}
                  padding={c.options.padding}
                  onPadding={c.setPadding}
                  fileCount={c.items.length}
                  busy={c.processing}
                  status={c.progress.visible ? c.progress.message || "Working…" : undefined}
                  note="Applied to every file. Videos keep MP4 or WebM; GIFs become a still PNG."
                  onProcess={c.processAll}
                />
              </section>
            </div>
          )}

          {c.tab === "results" && (
            <ResultsList
              items={c.items}
              onDownload={c.downloadOne}
              onDownloadAll={c.downloadAll}
              onGoToQueue={() => c.setTab("queue")}
            />
          )}
        </div>

        <p className={classes.note}>
          Video uses an FFmpeg engine that runs on your device, downloaded once from a CDN. Got 500 files or a TIFF?{" "}
          <a href={RELEASES_URL}>Get the Windows app</a>
        </p>
        {folderInput}
      </main>

      <SiteFooter />
    </>
  );
}
