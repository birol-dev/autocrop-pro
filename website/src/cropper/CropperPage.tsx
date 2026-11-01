import { Tabs, Title } from "@mantine/core";
import { ShieldCheckIcon } from "@phosphor-icons/react";

import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { Fade, Margins } from "../components/Section";
import { RELEASES_URL } from "../content/site";
import CropDropzone from "./components/CropDropzone";
import PreviewModal from "./components/PreviewModal";
import QueueGrid from "./components/QueueGrid";
import ResultsList from "./components/ResultsList";
import SettingsPanel from "./components/SettingsPanel";
import { useCropper, type CropperTab } from "./useCropper";
import classes from "./CropperPage.module.css";

export default function CropperPage() {
  const c = useCropper();
  const resultCount = c.items.filter((f) => f.resultBlob).length;
  const previewItem = c.items.find((f) => f.id === c.previewId) ?? null;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader current="cropper" />

      <main id="main" className={classes.page} data-tone="white">
        <Margins className={classes.inner}>
          <div className={classes.intro}>
            <Title order={1} className={classes.title}>
              Crop letterboxes <Fade>in your browser</Fade>
            </Title>
            <p className={classes.lead}>
              Drop a few images or videos, preview the detected crop, and download clean files. No upload, no account.
            </p>
            <p className={classes.note} role="note">
              <ShieldCheckIcon size={15} className={classes.noteIcon} aria-hidden="true" />
              <span>
                <strong className={classes.noteLead}>Files never leave this tab.</strong> Detection runs on your device.
                Video uses a local FFmpeg engine loaded once from a CDN — nothing is uploaded to AutoCrop Pro. Need 500
                files, TIFF, or huge videos?{" "}
                <a className={classes.noteLink} href={RELEASES_URL}>
                  Download the Windows app
                </a>
              </span>
            </p>
          </div>

          <div className={classes.layout}>
            <div className={classes.main}>
              <Tabs
                value={c.tab}
                onChange={(v) => v && c.setTab(v as CropperTab)}
                keepMounted={false}
                aria-label="Cropper views"
                variant="pills"
              >
                <Tabs.List className={classes.list}>
                  <Tabs.Tab
                    value="queue"
                    className={classes.tab}
                    rightSection={<span className={classes.count}>{c.items.length}</span>}
                  >
                    Queue
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="results"
                    className={classes.tab}
                    rightSection={<span className={classes.count}>{resultCount}</span>}
                  >
                    Results
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="queue" className={classes.panel}>
                  <div className={classes.stack}>
                    <CropDropzone
                      compact={c.items.length > 0}
                      disabled={c.processing}
                      loadingSamples={c.loadingSamples}
                      onFiles={c.addFiles}
                      onSample={c.addSamples}
                    />
                    {c.items.length > 0 && (
                      <QueueGrid
                        items={c.items}
                        disabled={c.processing}
                        onPreview={c.setPreviewId}
                        onRemove={c.removeFile}
                        onClear={c.clearAll}
                      />
                    )}
                  </div>
                </Tabs.Panel>

                <Tabs.Panel value="results" className={classes.panel}>
                  <ResultsList
                    items={c.items}
                    options={c.options}
                    onDownload={c.downloadOne}
                    onDownloadAll={c.downloadAll}
                    onGoToQueue={() => c.setTab("queue")}
                  />
                </Tabs.Panel>
              </Tabs>
            </div>

            <aside className={classes.aside}>
              <SettingsPanel
                options={c.options}
                fileCount={c.items.length}
                processing={c.processing}
                progress={c.progress}
                onTolerance={c.setTolerance}
                onPadding={c.setPadding}
                onFormat={c.setOutputFormat}
                onProcess={c.processAll}
              />
            </aside>
          </div>
        </Margins>
      </main>

      <PreviewModal item={previewItem} options={c.options} onClose={() => c.setPreviewId(null)} />
      <SiteFooter />
    </>
  );
}
