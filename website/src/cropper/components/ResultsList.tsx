import { Button, Center, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { DownloadSimpleIcon, FilmStripIcon, ImageSquareIcon, TrayIcon } from "@phosphor-icons/react";

import { displayedCrop } from "../useCropper";
import type { Item, Options } from "../types";
import { formatBytes } from "../utils";

type Props = {
  items: Item[];
  options: Options;
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
  onGoToQueue: () => void;
};

export default function ResultsList({ items, options, onDownload, onDownloadAll, onGoToQueue }: Props) {
  const ready = items.filter((f) => f.resultBlob && f.resultName);

  if (!ready.length) {
    return (
      <Center mih={280}>
        <Stack align="center" gap="xs" ta="center">
          <ThemeIcon size={56} radius="xl" variant="light" color="gray">
            <TrayIcon size={28} weight="duotone" />
          </ThemeIcon>
          <Text fw={600}>Nothing processed yet</Text>
          <Text size="sm" c="dimmed" maw={320}>
            Crop files from the queue and they will show up here, ready to download.
          </Text>
          <Button variant="light" size="xs" mt="xs" onClick={onGoToQueue}>
            Go to queue
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm" c="dimmed">
          Processed files stay in this tab until you download them.
        </Text>
        <Button leftSection={<DownloadSimpleIcon size={16} weight="bold" />} onClick={onDownloadAll} size="sm">
          {ready.length === 1 ? "Download" : `Download all (${ready.length}) as zip`}
        </Button>
      </Group>

      <Stack gap="xs" component="ul" m={0} p={0} style={{ listStyle: "none" }}>
        {ready.map((f) => {
          const Icon = f.type === "video" ? FilmStripIcon : ImageSquareIcon;
          const crop = displayedCrop(f, options) ?? f.crop;
          const dims = crop ? `${crop.w} × ${crop.h}` : null;
          return (
            <Paper component="li" key={f.id} withBorder p="sm" radius="md">
              <Group justify="space-between" wrap="nowrap" gap="md">
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                  <ThemeIcon size={38} radius="md" variant="light" color={f.type === "video" ? "pink" : "brand"}>
                    <Icon size={20} weight="duotone" />
                  </ThemeIcon>
                  <div style={{ minWidth: 0 }}>
                    <Text fw={600} size="sm" truncate title={f.resultName ?? undefined}>
                      {f.resultName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {dims ? `${dims} · ` : ""}
                      {formatBytes((f.resultBlob as Blob).size)}
                    </Text>
                  </div>
                </Group>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => onDownload(f.id)}
                  leftSection={<DownloadSimpleIcon size={14} weight="bold" />}
                  aria-label={`Download ${f.resultName}`}
                >
                  Download
                </Button>
              </Group>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}
