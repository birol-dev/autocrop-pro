import { Card, SimpleGrid, Text, ThemeIcon, Title, type MantineColor } from "@mantine/core";
import {
  ArrowsOutSimpleIcon,
  CropIcon,
  FileImageIcon,
  ImagesIcon,
  LightningIcon,
  ScanIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import { Section, SectionHeader } from "../components/Section";
import classes from "./Features.module.css";

type Feature = { icon: Icon; color: MantineColor; title: string; body: string };

const FEATURES: Feature[] = [
  {
    icon: LightningIcon,
    color: "yellow",
    title: "Parallel batch processing",
    body: "Rayon distributes work across every CPU core. Drop 500 files, click process, and watch them fly through the queue.",
  },
  {
    icon: ScanIcon,
    color: "brand",
    title: "Dual edge detectors",
    body: "Images get pixel histogram sweeps with a 1% noise floor. Videos run FFmpeg cropdetect across 30 sample frames for accurate widescreen boundaries.",
  },
  {
    icon: CropIcon,
    color: "teal",
    title: "Live preview overlay",
    body: "Click any queued file to see the detected crop region. Drag the tolerance slider and watch boundaries update in real time.",
  },
  {
    icon: ArrowsOutSimpleIcon,
    color: "pink",
    title: "Safe border padding",
    body: "Toggle a 10px buffer so the detector never clips subtitles, captions, or edge content you want to keep.",
  },
  {
    icon: FileImageIcon,
    color: "blue",
    title: "Flexible output formats",
    body: "Export lossless PNG for design assets, compressed JPEG or WebP for web, or keep the original file wrapper untouched.",
  },
  {
    icon: ImagesIcon,
    color: "grape",
    title: "Output gallery built in",
    body: "After processing, browse cropped files in a lightbox gallery. Open the output folder with one click.",
  },
];

export default function Features() {
  return (
    <Section id="features" tint labelledBy="features-title">
      <SectionHeader
        eyebrow="Under the hood"
        titleId="features-title"
        title="Built for speed, precision, and privacy"
        lead="Rust parallel processing on the backend. A visual dashboard on the front. No compromises."
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {FEATURES.map((f) => (
          <Card key={f.title} withBorder padding="xl" className={classes.card} data-reveal>
            <ThemeIcon size={48} radius="md" variant="light" color={f.color} mb="md">
              <f.icon size={26} weight="duotone" />
            </ThemeIcon>
            <Title order={3} mb={6}>
              {f.title}
            </Title>
            <Text c="dimmed" size="sm" lh={1.65}>
              {f.body}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Section>
  );
}
