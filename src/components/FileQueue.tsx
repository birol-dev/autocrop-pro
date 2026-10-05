import { ActionIcon, Badge, Button, Card, Group, Stack, Text, Tooltip } from "@mantine/core";
import { CheckCircleIcon, FilmStripIcon, ImageSquareIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { MediaFile } from "@/App";
import MediaThumb from "./MediaThumb";
import PageHeader from "./PageHeader";

import classes from "./MediaGrid.module.css";

type FileQueueProps = {
    files: MediaFile[];
    disabled: boolean;
    onPreviewFile: (file: MediaFile) => void;
    onRemoveFile: (id: string) => void;
    onClear: () => void;
};

function summarize(files: MediaFile[]): string {
    const videos = files.filter((f) => f.type === "video").length;
    const images = files.length - videos;
    const parts: string[] = [];
    if (images) parts.push(`${images} ${images === 1 ? "image" : "images"}`);
    if (videos) parts.push(`${videos} ${videos === 1 ? "video" : "videos"}`);
    return `${parts.join(" · ")} ready to process`;
}

export default function FileQueue({ files, disabled, onPreviewFile, onRemoveFile, onClear }: FileQueueProps) {
    return (
        <Stack gap="md">
            <PageHeader
                title="Queue"
                count={files.length}
                description={summarize(files)}
                actions={
                    <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        leftSection={<TrashIcon size={14} />}
                        onClick={onClear}
                        disabled={disabled}
                    >
                        Clear all
                    </Button>
                }
            />

            <div className={classes.grid}>
                {files.map((f) => {
                    const TypeIcon = f.type === "video" ? FilmStripIcon : ImageSquareIcon;
                    const ext = f.name.split(".").pop()?.toUpperCase();
                    return (
                        <Card
                            key={f.id}
                            withBorder
                            padding={0}
                            className={classes.card}
                            role="button"
                            tabIndex={0}
                            aria-label={`Preview ${f.name}`}
                            onClick={() => onPreviewFile(f)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onPreviewFile(f);
                                }
                            }}
                        >
                            <Card.Section>
                                <MediaThumb src={f.previewUrl} type={f.type} name={f.name}>
                                    {f.crop && (
                                        <Badge
                                            className={classes.badge}
                                            color="teal"
                                            variant="filled"
                                            size="sm"
                                            leftSection={<CheckCircleIcon size={12} weight="fill" />}
                                        >
                                            Crop ready
                                        </Badge>
                                    )}
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
                                                onRemoveFile(f.id);
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
                                <Group gap={6} c="dimmed">
                                    <TypeIcon size={14} />
                                    <Text size="xs" c="dimmed" tt="capitalize">
                                        {f.type}
                                        {ext ? ` · ${ext}` : ""}
                                    </Text>
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </div>
        </Stack>
    );
}
