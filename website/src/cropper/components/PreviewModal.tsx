import { useRef, useState } from "react";
import { Badge, Center, Group, Kbd, Loader, LoadingOverlay, Modal, SimpleGrid, Stack, Text } from "@mantine/core";
import { CropIcon, ImageSquareIcon } from "@phosphor-icons/react";

import { displayedCrop } from "../useCropper";
import type { Item, Options } from "../types";
import classes from "./PreviewModal.module.css";

type Props = {
  item: Item | null;
  options: Options;
  onClose: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} lh={1}>
        {label}
      </Text>
      <Text size="sm" fw={600} className={classes.statValue}>
        {value}
      </Text>
    </Stack>
  );
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/** Media stage + stats. Rendered with `key={item.id}` so its failure state resets per file. */
function PreviewBody({ item, options }: { item: Item; options: Options }) {
  const [failed, setFailed] = useState(false);
  const crop = displayedCrop(item, options);
  const src = item.thumbnailUrl ?? item.previewUrl;
  const showVideo = item.type === "video" && !item.thumbnailUrl;
  const detecting = item.status === "detecting";
  const known = item.naturalW > 0 && item.naturalH > 0;
  const trimmed =
    crop && known ? Math.max(0, Math.round((1 - (crop.w * crop.h) / (item.naturalW * item.naturalH)) * 100)) : null;

  return (
    <>
      <div className={classes.viewport}>
        {!failed ? (
          <div className={classes.stage}>
            {showVideo ? (
              <video
                className={classes.media}
                src={src}
                autoPlay
                muted
                loop
                playsInline
                onError={() => setFailed(true)}
              />
            ) : (
              <img className={classes.media} src={src} alt={item.name} onError={() => setFailed(true)} />
            )}

            {crop && known && (
              <div
                className={classes.crop}
                data-testid="crop-overlay"
                style={{
                  left: pct(crop.x, item.naturalW),
                  top: pct(crop.y, item.naturalH),
                  width: pct(crop.w, item.naturalW),
                  height: pct(crop.h, item.naturalH),
                }}
              >
                {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                  <span key={pos} className={classes.handle} data-pos={pos} />
                ))}
                <span className={classes.tag}>
                  {crop.w} × {crop.h}
                </span>
              </div>
            )}

            <LoadingOverlay
              visible={detecting}
              zIndex={5}
              overlayProps={{ backgroundOpacity: 0.55, blur: 3, color: "#0b0b12" }}
              loaderProps={{
                children: (
                  <Stack align="center" gap="xs">
                    <Loader color="white" size="md" />
                    <Text size="sm" c="white" fw={500}>
                      Detecting crop area…
                    </Text>
                  </Stack>
                ),
              }}
            />
          </div>
        ) : (
          <Center>
            <Stack align="center" gap="xs" c="dimmed">
              <ImageSquareIcon size={48} weight="duotone" />
              <Text size="sm">Preview unavailable in this browser</Text>
            </Stack>
          </Center>
        )}
      </div>

      <Group className={classes.footer} justify="space-between" align="center" px="md" py="sm" wrap="nowrap">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xl" verticalSpacing="xs">
          <Stat label="Original" value={known ? `${item.naturalW} × ${item.naturalH}` : "—"} />
          <Stat label="Cropped" value={crop ? `${crop.w} × ${crop.h}` : "—"} />
          <Stat label="Offset" value={crop ? `${crop.x}, ${crop.y}` : "—"} />
          <Stat label="Trimmed" value={trimmed !== null ? `${trimmed}%` : "—"} />
        </SimpleGrid>
        <Group gap={6} wrap="nowrap" c="dimmed" visibleFrom="sm">
          <Kbd size="xs">Esc</Kbd>
          <Text size="xs">to close</Text>
        </Group>
      </Group>
    </>
  );
}

export default function PreviewModal({ item, options, onClose }: Props) {
  // Keep the last item around so the content doesn't vanish during the close animation.
  const last = useRef<Item | null>(null);
  if (item) last.current = item;
  const shown = item ?? last.current;

  const crop = shown ? displayedCrop(shown, options) : null;

  const status =
    shown?.status === "detecting" ? (
      <Badge color="brand" variant="light" leftSection={<Loader size={10} color="brand" />}>
        Detecting crop…
      </Badge>
    ) : crop ? (
      <Badge color="teal" variant="light" leftSection={<CropIcon size={12} weight="bold" />}>
        Crop detected
      </Badge>
    ) : shown?.error ? (
      <Badge color="red" variant="light">
        Detection failed
      </Badge>
    ) : (
      <Badge color="gray" variant="light">
        No crop detected
      </Badge>
    );

  return (
    <Modal
      opened={!!item}
      onClose={onClose}
      size="min(1040px, 94vw)"
      padding={0}
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      transitionProps={{ transition: "pop", duration: 150 }}
      title={
        <Group gap="sm" wrap="nowrap">
          <Text fw={650} truncate maw={{ base: 150, sm: 420 }} title={shown?.name}>
            {shown?.name}
          </Text>
          {status}
        </Group>
      }
      styles={{
        header: { borderBottom: "1px solid var(--mantine-color-default-border)", padding: "12px 16px" },
        title: { minWidth: 0, flex: 1 },
        body: { padding: 0 },
      }}
    >
      {shown && <PreviewBody key={shown.id} item={shown} options={options} />}
    </Modal>
  );
}
