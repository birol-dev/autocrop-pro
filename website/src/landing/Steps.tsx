import { Anchor, Card, Code, Text, ThemeIcon, Title } from "@mantine/core";
import { DownloadSimpleIcon, SlidersHorizontalIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import { Section, SectionHeader } from "../components/Section";
import classes from "./Steps.module.css";

const ICONS: Icon[] = [UploadSimpleIcon, SlidersHorizontalIcon, DownloadSimpleIcon];

export default function Steps() {
  return (
    <Section id="how-it-works" labelledBy="how-title">
      <SectionHeader
        eyebrow="Workflow"
        titleId="how-title"
        title="Three steps. No learning curve."
        lead={
          <>
            Same flow in the{" "}
            <Anchor href="/cropper/" inherit fw={600}>
              browser cropper
            </Anchor>{" "}
            or the Windows app. The app is built for hundreds of files at once.
          </>
        }
      />

      <ol className={classes.track}>
        <li>
          <Step n={1} title="Drop your files">
            Drag a folder of JPG, PNG, WEBP, MP4, MOV, MKV, or any supported format onto the app. Hundreds at once.
          </Step>
        </li>
        <li>
          <Step n={2} title="Preview & tune">
            Click any file to see the crop overlay. Adjust tolerance until borders snap perfectly — without touching
            pixel math.
          </Step>
        </li>
        <li>
          <Step n={3} title="Batch export">
            Hit process. Cropped files land in <Code>Documents/AutoCrop_Output/</Code>. Originals stay untouched.
          </Step>
        </li>
      </ol>
    </Section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  const StepIcon = ICONS[n - 1];
  return (
    <Card withBorder padding="xl" className={classes.card} data-reveal>
      <div className={classes.head}>
        <ThemeIcon size={52} radius="xl" variant="filled" className={classes.num}>
          <span>{n}</span>
        </ThemeIcon>
        <StepIcon size={30} weight="duotone" className={classes.icon} aria-hidden="true" />
      </div>
      <Title order={3} mb={6}>
        {title}
      </Title>
      <Text c="dimmed" size="sm" lh={1.65}>
        {children}
      </Text>
    </Card>
  );
}
