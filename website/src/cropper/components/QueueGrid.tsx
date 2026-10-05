import { ActionIcon, Badge, Button, Card, Group, Stack, Text, Tooltip } from "@mantine/core";
import { FilmStripIcon, ImageSquareIcon, TrashIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import MediaThumb from "@app/components/MediaThumb";

import type { Item } from "../types";
import { formatBytes } from "../utils";
import StatusBadge from "./StatusBadge";
import classes from "./QueueGrid.module.css";

type Props = {
  items: Item[];
  disabled: boolean;
  onPreview: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

function summarize(items: Item[]): string {
  const videos = items.filter((f) => f.type === "video").length;
  const images = items.length - videos;
  const parts: string[] = [];
  if (images) parts.push(`${images} ${images === 1 ? "image" : "images"}`);
  if (videos) parts.push(`${videos} ${videos === 1 ? "video" : "videos"}`);
  return `${parts.join(" · ")} ready to process`;
}

export default function QueueGrid({ items, disabled, onPreview, onRemove, onClear }: Props) {
  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" c="dimmed">
          {summarize(items)}
        </Text>
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          leftSection={<TrashIcon size={14} />}
          onClick={onClear}
          disabled={disabled}
        >
          Clear all
        </Button>
      </Group>

      <div className={classes.grid}>
        {items.map((f) => {
          const TypeIcon = f.type === "video" ? FilmStripIcon : ImageSquareIcon;
          const ext = f.name.split(".").pop()?.toUpperCase();
          const thumbSrc = f.thumbnailUrl ?? f.previewUrl;
          return (
            <Card
              key={f.id}
              withBorder
              padding={0}
              className={classes.card}
              role="button"
              tabIndex={0}
              aria-label={`Preview ${f.name}`}
              onClick={() => onPreview(f.id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPreview(f.id);
                }
              }}
            >
              <Card.Section>
                <MediaThumb src={thumbSrc} type={f.thumbnailUrl ? "image" : f.type} name={f.name} lazy>
                  <div className={classes.badge}>
                    <StatusBadge status={f.status} />
                  </div>
                  <Tooltip label="Remove from queue">
                    <ActionIcon
                      className={classes.action}
                      variant="filled"
                      color="dark"
                      size="md"
                      radius="xl"
                      disabled={disabled}
                      aria-label={`Remove ${f.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(f.id);
                      }}
                    >
                      <XIcon size={14} weight="bold" />
                    </ActionIcon>
                  </Tooltip>
                </MediaThumb>
              </Card.Section>

              <Stack gap={4} p="sm">
                <Text fw={600} size="sm" truncate title={f.name}>
                  {f.name}
                </Text>
                <Group gap={6} c="dimmed" wrap="nowrap">
                  <TypeIcon size={14} />
                  <Text size="xs" c="dimmed" truncate>
                    {f.type === "video" ? "Video" : "Image"}
                    {ext ? ` · ${ext}` : ""} · {formatBytes(f.file.size)}
                  </Text>
                </Group>
                {f.error && (
                  <Text size="xs" c="red" lh={1.4} lineClamp={3} role="alert">
                    {f.error}
                  </Text>
                )}
                {(f.risky || f.oversized) && !f.error && (
                  <Group gap={4}>
                    {f.risky && (
                      <Tooltip label="This format may not decode in the browser. The Windows app handles it." multiline w={220}>
                        <Badge size="xs" color="yellow" variant="light" leftSection={<WarningIcon size={10} weight="fill" />}>
                          May need Windows app
                        </Badge>
                      </Tooltip>
                    )}
                    {f.oversized && (
                      <Badge size="xs" color="yellow" variant="light" leftSection={<WarningIcon size={10} weight="fill" />}>
                        Over 80 MB
                      </Badge>
                    )}
                  </Group>
                )}
              </Stack>
            </Card>
          );
        })}
      </div>
    </Stack>
  );
}
