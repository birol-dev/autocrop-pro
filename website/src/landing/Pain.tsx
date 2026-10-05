import { Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title, type MantineColor } from "@mantine/core";
import { ArrowRightIcon, ClockIcon, ShieldCheckIcon, SparkleIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import { Accent, Section, SectionHeader } from "../components/Section";
import classes from "./Pain.module.css";

type Pain = {
  icon: Icon;
  color: MantineColor;
  title: string;
  quote: string;
  body: string;
  from: [string, string];
  to: [string, string];
};

const PAINS: Pain[] = [
  {
    icon: ClockIcon,
    color: "orange",
    title: "The Premiere trap",
    quote: "I just need to strip letterboxes — not open a full timeline for each clip.",
    body: "Import, crop, export, repeat. For a folder of screen recordings or VHS rips, that's an afternoon gone. AutoCrop Pro processes the whole folder while you grab coffee.",
    from: ["~3 min", "per file manually"],
    to: ["<1 sec", "each in batch"],
  },
  {
    icon: ShieldCheckIcon,
    color: "teal",
    title: "The upload you can't afford",
    quote: "My client's NDA footage is not going to a cloud cropper.",
    body: "Cloud croppers want gigabytes uploaded over Wi-Fi. Slow, lossy, and a security nightmare for sensitive media. AutoCrop Pro crops in your browser tab or on your PC — files never go to our servers.",
    from: ["0 bytes", "uploaded"],
    to: ["100%", "local"],
  },
  {
    icon: TerminalWindowIcon,
    color: "blue",
    title: "The FFmpeg gamble",
    quote: "I know cropdetect works — I just don't trust myself with 400 files.",
    body: "One wrong flag in a batch script and you've re-encoded an archive with artifacts. AutoCrop Pro gives you FFmpeg's power with a visual preview before you commit.",
    from: ["CLI risk", "batch scripts"],
    to: ["Visual control", "live preview"],
  },
  {
    icon: SparkleIcon,
    color: "pink",
    title: "The quality death spiral",
    quote: "I cropped it twice and now it looks like a potato.",
    body: "Every re-encode through a web tool adds compression damage. AutoCrop Pro offers lossless PNG output or copies the original wrapper. Crop once, crop right.",
    from: ["Lossless PNG", "zero artifacts"],
    to: ["Keep original", "no re-encode"],
  },
];

export default function PainSection() {
  return (
    <Section id="pain" tint labelledBy="pain-title">
      <SectionHeader
        eyebrow="The real problem"
        eyebrowColor="orange"
        titleId="pain-title"
        title={
          <>
            Black bars aren&apos;t hard to crop. <Accent>Doing it 200 times is.</Accent>
          </>
        }
        lead="Every editor, archivist, and content team hits the same wall. The crop takes seconds — the workflow around it eats your week."
      />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {PAINS.map((p, i) => (
          <Card key={p.title} withBorder padding="xl" className={classes.card} data-reveal>
            <Stack gap="md" h="100%">
              <Group justify="space-between" wrap="nowrap">
                <ThemeIcon size={46} radius="md" variant="light" color={p.color}>
                  <p.icon size={24} weight="duotone" />
                </ThemeIcon>
                <Text className={classes.number} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </Text>
              </Group>

              <Title order={3}>{p.title}</Title>

              <blockquote className={classes.quote} style={{ ["--accent" as string]: `var(--mantine-color-${p.color}-5)` }}>
                &ldquo;{p.quote}&rdquo;
              </blockquote>

              <Text size="sm" c="dimmed" lh={1.65} style={{ flex: 1 }}>
                {p.body}
              </Text>

              <div className={classes.stat}>
                <div>
                  <Text fw={700} fz="sm">
                    {p.from[0]}
                  </Text>
                  <Text fz={11} c="dimmed" lh={1.3}>
                    {p.from[1]}
                  </Text>
                </div>
                <ArrowRightIcon size={16} weight="bold" className={classes.arrow} aria-hidden="true" />
                <div>
                  <Text fw={700} fz="sm" c="teal">
                    {p.to[0]}
                  </Text>
                  <Text fz={11} c="dimmed" lh={1.3}>
                    {p.to[1]}
                  </Text>
                </div>
              </div>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Section>
  );
}
