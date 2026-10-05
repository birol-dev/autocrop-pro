import { Badge, Box, Container, Divider, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { FilmStripIcon, ImageSquareIcon } from "@phosphor-icons/react";

import classes from "./ProofStrip.module.css";

const IMAGES = ["JPG", "PNG", "WEBP", "BMP", "GIF", "TIFF"];
const VIDEOS = ["MP4", "MOV", "MKV", "AVI", "WEBM", "FLV"];

const STATS = [
  { value: "100%", label: "Offline — no cloud uploads" },
  { value: "0 MB", label: "Data sent to servers" },
  { value: "500+", label: "Files per batch run" },
  { value: "Parallel", label: "Rayon multi-core threads" },
];

function FormatGroup({ icon, label, formats }: { icon: React.ReactNode; label: string; formats: string[] }) {
  return (
    <Group gap="xs" wrap="wrap" justify="center">
      <Group gap={6} c="dimmed" wrap="nowrap">
        {icon}
        <Text size="sm" fw={600}>
          {label}
        </Text>
      </Group>
      {formats.map((f) => (
        <Badge key={f} variant="default" radius="sm" size="md" fw={600}>
          {f}
        </Badge>
      ))}
    </Group>
  );
}

/** Supported formats + headline numbers, directly under the hero. */
export default function ProofStrip() {
  return (
    <Box className={classes.strip}>
      <Container size={1200} px={{ base: "md", sm: "xl" }}>
        <Group justify="center" gap="lg" py="lg" role="group" aria-label="Supported file formats">
          <FormatGroup icon={<ImageSquareIcon size={18} weight="duotone" />} label="Images" formats={IMAGES} />
          <Divider orientation="vertical" visibleFrom="md" />
          <FormatGroup icon={<FilmStripIcon size={18} weight="duotone" />} label="Videos" formats={VIDEOS} />
        </Group>
      </Container>

      <Divider />

      <Container size={1200} px={{ base: "md", sm: "xl" }} py={{ base: "xl", sm: 48 }}>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl" verticalSpacing="xl" aria-label="Key metrics" data-reveal>
          {STATS.map((s) => (
            <Stack key={s.label} gap={4} align="center" ta="center">
              <Text className={classes.value}>{s.value}</Text>
              <Text size="sm" c="dimmed">
                {s.label}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
