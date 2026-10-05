import { Button, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { ImageIcon, PlusIcon, UploadSimpleIcon } from "@phosphor-icons/react";

import classes from "./CropDropzone.module.css";

type Props = {
  /** Once the queue has files the zone collapses into a slim "add more" bar. */
  compact: boolean;
  disabled: boolean;
  loadingSamples: boolean;
  onFiles: (files: File[]) => void;
  onSample: () => void;
};

const FORMATS = "PNG · JPG · WebP · BMP · TIFF · GIF · MP4 · MOV · MKV · AVI · WebM";

export default function CropDropzone({ compact, disabled, loadingSamples, onFiles, onSample }: Props) {
  return (
    <>
      <Dropzone
        onDrop={onFiles}
        disabled={disabled}
        className={classes.root}
        data-compact={compact || undefined}
        radius="lg"
        aria-label="Add media files"
      >
        {compact ? (
          <Group justify="space-between" wrap="nowrap" gap="md">
            <Group wrap="nowrap" gap="md">
              <ThemeIcon size={40} radius="md" variant="light">
                <UploadSimpleIcon size={22} weight="bold" />
              </ThemeIcon>
              <div>
                <Text fw={600}>
                  <Dropzone.Accept>Release to add files</Dropzone.Accept>
                  <Dropzone.Idle>Drop more files here</Dropzone.Idle>
                </Text>
                <Text size="xs" c="dimmed">
                  or click to browse your computer
                </Text>
              </div>
            </Group>
            <Button component="span" variant="light" leftSection={<PlusIcon size={16} weight="bold" />} visibleFrom="xs">
              Add files
            </Button>
          </Group>
        ) : (
          <Stack align="center" gap="sm" className={classes.empty}>
            <ThemeIcon size={68} radius="xl" variant="light">
              <UploadSimpleIcon size={34} weight="duotone" />
            </ThemeIcon>
            <Title order={3} mt="xs">
              <Dropzone.Accept>Release to add files</Dropzone.Accept>
              <Dropzone.Idle>Drop your media here</Dropzone.Idle>
            </Title>
            <Text c="dimmed" maw={440}>
              Add images or videos and AutoCrop Pro will find and trim the black borders — right in this tab.
            </Text>
            <Button component="span" mt="xs" size="md" leftSection={<PlusIcon size={18} weight="bold" />}>
              Browse files
            </Button>
            <Text size="xs" c="dimmed" mt="xs">
              {FORMATS}
            </Text>
          </Stack>
        )}
      </Dropzone>

      {!compact && (
        <Group justify="center" gap={6} mt="md" wrap="wrap">
          <Text size="sm" c="dimmed">
            No files handy?
          </Text>
          <Button
            variant="subtle"
            size="compact-sm"
            onClick={onSample}
            loading={loadingSamples}
            disabled={disabled}
            leftSection={<ImageIcon size={16} weight="duotone" />}
          >
            Try sample images
          </Button>
        </Group>
      )}

      <Dropzone.FullScreen onDrop={onFiles} disabled={disabled}>
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: "none" }}>
          <ThemeIcon size={80} radius="xl">
            <UploadSimpleIcon size={40} weight="bold" />
          </ThemeIcon>
          <div>
            <Title order={2}>Drop to add files</Title>
            <Text c="dimmed">Images and videos stay on your device.</Text>
          </div>
        </Group>
      </Dropzone.FullScreen>
    </>
  );
}
