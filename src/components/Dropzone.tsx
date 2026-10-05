import { Button, Group, Stack, Text, ThemeIcon, Title, UnstyledButton } from "@mantine/core";
import { PlusIcon, UploadSimpleIcon } from "@phosphor-icons/react";

import classes from "./Dropzone.module.css";

type DropzoneProps = {
    /** A file is currently being dragged over the window (Tauri native drag events). */
    isDragHovering: boolean;
    isProcessing: boolean;
    /** Once the queue has files the zone collapses into a slim "add more" bar. */
    compact: boolean;
    onBrowse: () => void;
};

export default function Dropzone({ isDragHovering, isProcessing, compact, onBrowse }: DropzoneProps) {
    const heading = isDragHovering ? "Release to add files" : compact ? "Drop more files here" : "Drop your media here";

    return (
        <UnstyledButton
            className={classes.root}
            onClick={onBrowse}
            data-hover={isDragHovering || undefined}
            data-disabled={isProcessing || undefined}
            data-compact={compact || undefined}
            aria-label="Add media files"
            p={compact ? "md" : 48}
        >
            {compact ? (
                <Group justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap" gap="md">
                        <ThemeIcon size={40} radius="md" variant={isDragHovering ? "filled" : "light"}>
                            <UploadSimpleIcon size={22} weight="bold" />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>{heading}</Text>
                            <Text size="xs" c="dimmed">
                                or click to browse your computer
                            </Text>
                        </div>
                    </Group>
                    <Button component="span" variant="light" leftSection={<PlusIcon size={16} weight="bold" />}>
                        Add files
                    </Button>
                </Group>
            ) : (
                <Stack align="center" gap="sm">
                    <ThemeIcon size={68} radius="xl" variant={isDragHovering ? "filled" : "light"}>
                        <UploadSimpleIcon size={34} weight={isDragHovering ? "bold" : "duotone"} />
                    </ThemeIcon>
                    <Title order={3} mt="xs">
                        {heading}
                    </Title>
                    <Text c="dimmed" maw={420}>
                        Add images or videos and AutoCrop Pro will find and trim the black borders for you.
                    </Text>
                    <Button component="span" mt="xs" size="md" leftSection={<PlusIcon size={18} weight="bold" />}>
                        Browse files
                    </Button>
                    <Text size="xs" c="dimmed" mt="xs">
                        PNG · JPG · WebP · BMP · TIFF · GIF · MP4 · MOV · MKV · AVI · WebM
                    </Text>
                </Stack>
            )}
        </UnstyledButton>
    );
}
