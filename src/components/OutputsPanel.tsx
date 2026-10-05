import { useState, useEffect, useCallback } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { ActionIcon, Button, Card, Group, Modal, Paper, Skeleton, Stack, Text, ThemeIcon, Tooltip } from "@mantine/core";
import {
    ArrowRightIcon,
    ArrowsClockwiseIcon,
    ClockIcon,
    FolderOpenIcon,
    ImagesIcon,
} from "@phosphor-icons/react";
import { OutputFile } from "@/App";
import { notifyError } from "@/lib/notify";
import MediaThumb from "./MediaThumb";
import PageHeader from "./PageHeader";

import classes from "./MediaGrid.module.css";

type OutputsPanelProps = {
    /** Trigger a refresh whenever this counter increments (e.g. after processing) */
    refreshTick: number;
    onGoToQueue: () => void;
};

function timeAgo(unixSec: number): string {
    const diff = Math.floor(Date.now() / 1000) - unixSec;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function OutputsPanel({ refreshTick, onGoToQueue }: OutputsPanelProps) {
    const [files, setFiles] = useState<OutputFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [lightbox, setLightbox] = useState<OutputFile | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await invoke<OutputFile[]>("list_output_files");
            setFiles(result);
        } catch (err) {
            notifyError(`Failed to load outputs: ${String(err)}`);
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    }, []);

    // Load on mount and whenever refreshTick changes
    useEffect(() => { load(); }, [load, refreshTick]);

    const handleReveal = async (file: OutputFile) => {
        try {
            await invoke("reveal_in_explorer", { path: file.path });
        } catch (err) {
            notifyError(`Could not open folder: ${String(err)}`);
        }
    };

    const handleOpenFolder = async () => {
        try {
            await invoke("open_output_folder");
        } catch (err) {
            notifyError(`Could not open folder: ${String(err)}`);
        }
    };

    return (
        <Stack gap="md">
            <PageHeader
                title="Outputs"
                count={files.length}
                description="Newest first · click to preview, double-click to reveal in Explorer"
                actions={
                    <>
                        <Button
                            variant="default"
                            leftSection={<FolderOpenIcon size={16} />}
                            onClick={handleOpenFolder}
                        >
                            Open folder
                        </Button>
                        <Tooltip label="Refresh">
                            <ActionIcon
                                variant="default"
                                size={36}
                                onClick={load}
                                loading={loading && loaded}
                                aria-label="Refresh outputs"
                            >
                                <ArrowsClockwiseIcon size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                }
            />

            {/* First load: skeleton grid */}
            {!loaded && (
                <div className={classes.grid}>
                    {Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} height={170} radius="lg" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {loaded && files.length === 0 && (
                <Paper
                    withBorder
                    p={48}
                    style={{ borderStyle: "dashed", borderWidth: 2 }}
                >
                    <Stack align="center" gap="sm">
                        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                            <ImagesIcon size={32} weight="duotone" />
                        </ThemeIcon>
                        <Text fw={650} size="lg" mt="xs">
                            No outputs yet
                        </Text>
                        <Text c="dimmed" size="sm" ta="center" maw={360}>
                            Cropped files land here once you process your queue.
                        </Text>
                        <Button
                            variant="light"
                            mt="xs"
                            rightSection={<ArrowRightIcon size={16} weight="bold" />}
                            onClick={onGoToQueue}
                        >
                            Go to queue
                        </Button>
                    </Stack>
                </Paper>
            )}

            {/* Grid */}
            {loaded && files.length > 0 && (
                <div className={classes.grid}>
                    {files.map((file) => (
                        <Card
                            key={file.path}
                            withBorder
                            padding={0}
                            className={classes.card}
                            role="button"
                            tabIndex={0}
                            aria-label={`Preview ${file.name}`}
                            title="Click to preview · Double-click to reveal in Explorer"
                            onClick={() => setLightbox(file)}
                            onDoubleClick={() => handleReveal(file)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setLightbox(file);
                                }
                            }}
                        >
                            <Card.Section>
                                <MediaThumb
                                    src={convertFileSrc(file.path)}
                                    type={file.file_type === "video" ? "video" : "image"}
                                    name={file.name}
                                    ratio={4 / 3}
                                    lazy
                                >
                                    <Tooltip label="Reveal in Explorer">
                                        <ActionIcon
                                            className={classes.action}
                                            variant="filled"
                                            color="dark"
                                            size="md"
                                            radius="xl"
                                            aria-label={`Reveal ${file.name} in Explorer`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReveal(file);
                                            }}
                                            onDoubleClick={(e) => e.stopPropagation()}
                                        >
                                            <FolderOpenIcon size={14} />
                                        </ActionIcon>
                                    </Tooltip>
                                </MediaThumb>
                            </Card.Section>

                            <Stack gap={4} p="sm">
                                <Text fw={600} size="sm" truncate title={file.name}>
                                    {file.name}
                                </Text>
                                <Group gap={6} c="dimmed">
                                    <ClockIcon size={14} />
                                    <Text size="xs" c="dimmed">
                                        {timeAgo(file.modified_at)}
                                    </Text>
                                </Group>
                            </Stack>
                        </Card>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <Modal
                opened={!!lightbox}
                onClose={() => setLightbox(null)}
                size="min(1040px, 94vw)"
                overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
                transitionProps={{ transition: "pop", duration: 150 }}
                title={
                    <Text fw={650} truncate maw={560}>
                        {lightbox?.name}
                    </Text>
                }
            >
                {lightbox && (
                    <Stack gap="md">
                        <Group justify="center" bg="var(--mantine-color-default-hover)" p="md" style={{ borderRadius: "var(--mantine-radius-md)" }}>
                            {lightbox.file_type === "video" ? (
                                <video
                                    src={convertFileSrc(lightbox.path)}
                                    style={{ maxWidth: "100%", maxHeight: "62vh", borderRadius: 8 }}
                                    controls
                                    autoPlay
                                    muted
                                />
                            ) : (
                                <img
                                    src={convertFileSrc(lightbox.path)}
                                    alt={lightbox.name}
                                    style={{ maxWidth: "100%", maxHeight: "62vh", objectFit: "contain", borderRadius: 8 }}
                                />
                            )}
                        </Group>
                        <Group justify="space-between">
                            <Group gap={6} c="dimmed">
                                <ClockIcon size={14} />
                                <Text size="sm" c="dimmed">
                                    {timeAgo(lightbox.modified_at)}
                                </Text>
                            </Group>
                            <Button leftSection={<FolderOpenIcon size={16} />} onClick={() => handleReveal(lightbox)}>
                                Reveal in Explorer
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}
