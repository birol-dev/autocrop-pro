import { useRef, useState } from "react";
import { Badge, Center, Group, Kbd, Loader, LoadingOverlay, Modal, SimpleGrid, Stack, Text } from "@mantine/core";
import { CropIcon, ImageSquareIcon } from "@phosphor-icons/react";
import { MediaFile, CropArea } from "@/App";

import classes from "./PreviewModal.module.css";

type PreviewModalProps = {
    previewFile: MediaFile | null;
    closePreview: () => void;
    detectingCrop: boolean;
    detectedCrop: CropArea | null;
};

type Dim = { w: number; h: number };

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

type PreviewBodyProps = {
    file: MediaFile;
    crop: CropArea | null;
    detectingCrop: boolean;
};

/** Media stage + stats. Rendered with `key={file.id}` so its measured size resets per file. */
function PreviewBody({ file, crop, detectingCrop }: PreviewBodyProps) {
    const [dim, setDim] = useState<Dim | null>(null);
    const [failed, setFailed] = useState(false);

    const trimmed = crop && dim && dim.w > 0 ? Math.max(0, Math.round((1 - (crop.w * crop.h) / (dim.w * dim.h)) * 100)) : null;

    return (
        <>
            <div className={classes.viewport}>
                {file.previewUrl && !failed ? (
                    <div className={classes.stage}>
                        {file.type === "video" ? (
                            <video
                                className={classes.media}
                                src={file.previewUrl}
                                autoPlay
                                muted
                                loop
                                onLoadedMetadata={(e) => setDim({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })}
                                onError={() => setFailed(true)}
                            />
                        ) : (
                            <img
                                className={classes.media}
                                src={file.previewUrl}
                                alt={file.name}
                                onLoad={(e) => setDim({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                                onError={() => setFailed(true)}
                            />
                        )}

                        {crop && dim && dim.w > 0 && (
                            <div
                                className={classes.crop}
                                style={{
                                    left: pct(crop.x, dim.w),
                                    top: pct(crop.y, dim.h),
                                    width: pct(crop.w, dim.w),
                                    height: pct(crop.h, dim.h),
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
                            visible={detectingCrop}
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
                            <Text size="sm">Preview unavailable</Text>
                        </Stack>
                    </Center>
                )}
            </div>

            <Group className={classes.footer} justify="space-between" align="center" px="md" py="sm" wrap="nowrap">
                <SimpleGrid cols={4} spacing="xl" verticalSpacing="xs">
                    <Stat label="Original" value={dim ? `${dim.w} × ${dim.h}` : "—"} />
                    <Stat label="Cropped" value={crop ? `${crop.w} × ${crop.h}` : "—"} />
                    <Stat label="Offset" value={crop ? `${crop.x}, ${crop.y}` : "—"} />
                    <Stat label="Trimmed" value={trimmed !== null ? `${trimmed}%` : "—"} />
                </SimpleGrid>
                <Group gap={6} wrap="nowrap" c="dimmed">
                    <Kbd size="xs">Esc</Kbd>
                    <Text size="xs">to close</Text>
                </Group>
            </Group>
        </>
    );
}

export default function PreviewModal({ previewFile, closePreview, detectingCrop, detectedCrop }: PreviewModalProps) {
    // Keep the last file around so the content doesn't vanish during the close animation.
    const lastFile = useRef<MediaFile | null>(null);
    if (previewFile) lastFile.current = previewFile;
    const file = previewFile ?? lastFile.current;

    const crop = detectedCrop && detectedCrop.w > 0 && detectedCrop.h > 0 ? detectedCrop : null;

    const status = detectingCrop ? (
        <Badge color="brand" variant="light" leftSection={<Loader size={10} color="brand" />}>
            Detecting crop…
        </Badge>
    ) : crop ? (
        <Badge color="teal" variant="light" leftSection={<CropIcon size={12} weight="bold" />}>
            Crop detected
        </Badge>
    ) : (
        <Badge color="gray" variant="light">
            No crop detected
        </Badge>
    );

    return (
        <Modal
            opened={!!previewFile}
            onClose={closePreview}
            size="min(1040px, 94vw)"
            padding={0}
            overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
            transitionProps={{ transition: "pop", duration: 150 }}
            title={
                <Group gap="sm" wrap="nowrap">
                    <Text fw={650} truncate maw={420} title={file?.name}>
                        {file?.name}
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
            {file && <PreviewBody key={file.id} file={file} crop={crop} detectingCrop={detectingCrop} />}
        </Modal>
    );
}
