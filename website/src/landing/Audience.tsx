import { Card, SimpleGrid, Text, ThemeIcon, Title, type MantineColor } from "@mantine/core";
import { CameraIcon, FilmReelIcon, LockKeyIcon, VideoCameraIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import { Section, SectionHeader } from "../components/Section";

type Persona = { icon: Icon; color: MantineColor; title: string; body: string };

const PERSONAS: Persona[] = [
  {
    icon: VideoCameraIcon,
    color: "pink",
    title: "YouTube & video editors",
    body: "Standardize mixed-aspect footage, screen recordings, and old TV rips without opening a timeline for each clip.",
  },
  {
    icon: CameraIcon,
    color: "brand",
    title: "Designers & photographers",
    body: "Batch-strip scanner borders and black margins from product shots, mockups, and web assets.",
  },
  {
    icon: FilmReelIcon,
    color: "orange",
    title: "Archivists & hobbyists",
    body: "Digitizing VHS, DVD, or scanned collections? Remove thick analog borders from hundreds of files overnight.",
  },
  {
    icon: LockKeyIcon,
    color: "teal",
    title: "Agencies with NDA clients",
    body: "Sensitive footage stays on your machine. Crop in the tab or in the Windows app — no third-party cloud uploads.",
  },
];

export default function Audience() {
  return (
    <Section labelledBy="audience-title" tint>
      <SectionHeader eyebrow="Who it's for" titleId="audience-title" title="Built for people who process media in bulk" />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {PERSONAS.map((p) => (
          <Card key={p.title} padding="xl" bg="transparent" data-reveal>
            <ThemeIcon size={44} radius="xl" variant="light" color={p.color} mb="md">
              <p.icon size={24} weight="duotone" />
            </ThemeIcon>
            <Title order={3} mb={6}>
              {p.title}
            </Title>
            <Text c="dimmed" size="sm" lh={1.65}>
              {p.body}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Section>
  );
}
