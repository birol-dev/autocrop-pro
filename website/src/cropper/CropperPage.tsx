import { Alert, Anchor, Badge, Container, Paper, Stack, Tabs, Text, Title } from "@mantine/core";
import { QueueIcon, ShieldCheckIcon, TrayArrowDownIcon } from "@phosphor-icons/react";

import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
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

      <main id="main" className={classes.page}>
        <Container size={1280} px={{ base: "md", sm: "xl" }}>
          <Stack gap="sm" mb="lg" className={classes.intro}>
            <Badge variant="light" size="lg" tt="uppercase" w="fit-content" className={classes.eyebrow}>
              Free · runs in your browser
            </Badge>
            <Title order={1} className={classes.title}>
              Crop letterboxes in your browser
            </Title>
            <Text c="dimmed" fz="lg" maw={640} lh={1.55}>
              Drop a few images or videos, preview the detected crop, and download clean files. No upload, no account.
            </Text>
          </Stack>

          <Alert
            variant="light"
            color="teal"
            radius="lg"
            icon={<ShieldCheckIcon size={22} weight="duotone" />}
            title="Files never leave this tab."
            mb="lg"
            role="note"
          >
            Detection runs on your device. Video uses a local FFmpeg engine loaded once from a CDN — nothing is uploaded
            to AutoCrop Pro.{" "}
            <Text span inherit>
              Need 500 files, TIFF, or huge videos?{" "}
              <Anchor href={RELEASES_URL} inherit fw={600}>
                Download the Windows app
              </Anchor>
            </Text>
          </Alert>

          <div className={classes.layout}>
            <Paper withBorder radius="xl" className={classes.main}>
              <Tabs
                value={c.tab}
                onChange={(v) => v && c.setTab(v as CropperTab)}
                keepMounted={false}
                aria-label="Cropper views"
              >
                <Tabs.List px="md" pt={4}>
                  <Tabs.Tab
                    value="queue"
                    leftSection={<QueueIcon size={16} weight="bold" />}
                    rightSection={
                      <Badge size="sm" variant="light" circle={c.items.length < 10}>
                        {c.items.length}
                      </Badge>
                    }
                  >
                    Queue
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="results"
                    leftSection={<TrayArrowDownIcon size={16} weight="bold" />}
                    rightSection={
                      <Badge size="sm" variant="light" color={resultCount ? "teal" : "gray"} circle={resultCount < 10}>
                        {resultCount}
                      </Badge>
                    }
                  >
                    Results
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="queue" p={{ base: "md", sm: "lg" }}>
                  <Stack gap="md">
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
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="results" p={{ base: "md", sm: "lg" }}>
                  <ResultsList
                    items={c.items}
                    options={c.options}
                    onDownload={c.downloadOne}
                    onDownloadAll={c.downloadAll}
                    onGoToQueue={() => c.setTab("queue")}
                  />
                </Tabs.Panel>
              </Tabs>
            </Paper>

            <Paper withBorder radius="xl" className={classes.aside}>
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
            </Paper>
          </div>
        </Container>
      </main>

      <PreviewModal item={previewItem} options={c.options} onClose={() => c.setPreviewId(null)} />
      <SiteFooter />
    </>
  );
}
