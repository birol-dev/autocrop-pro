import {
    Badge,
    Box,
    Button,
    Divider,
    Group,
    Paper,
    Progress,
    ScrollArea,
    Select,
    Slider,
    Stack,
    Switch,
    Text,
    Title,
} from "@mantine/core";
import {
    ArrowsOutSimpleIcon,
    CaretRightIcon,
    FileImageIcon,
    LightningIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { ProcessOptions } from "@/App";

type SettingsSidebarProps = {
    options: ProcessOptions;
    setOptions: React.Dispatch<React.SetStateAction<ProcessOptions>>;
    hasFiles: boolean;
    isProcessing: boolean;
    progress: number;
    progressMsg: string;
    filesCount: number;
    onProcessAll: () => void;
};

const FORMATS = [
    { value: "Same as source", label: "Same as source" },
    { value: "png", label: "PNG (Lossless)" },
    { value: "jpg", label: "JPEG (Compressed)" },
    { value: "webp", label: "WebP" },
];

// Label on the left, switch on the right.
const switchStyles = {
    body: { justifyContent: "space-between", alignItems: "center", width: "100%" },
    labelWrapper: { flex: 1 },
} as const;

export default function SettingsSidebar({
    options,
    setOptions,
    hasFiles,
    isProcessing,
    progress,
    progressMsg,
    filesCount,
    onProcessAll,
}: SettingsSidebarProps) {
    const canProcess = hasFiles && !isProcessing;

    return (
        <Stack gap={0} h="100%">
            <ScrollArea flex={1} type="auto" offsetScrollbars>
                <Stack gap="md" p="md">
                    <div>
                        <Title order={3}>Export settings</Title>
                        <Text size="sm" c="dimmed" mt={2}>
                            Applied to every file in the queue.
                        </Text>
                    </div>

                    {/* Detection tolerance */}
                    <Paper withBorder p="md">
                        <Group justify="space-between" mb="xs">
                            <Text fw={600} size="sm">
                                Detection tolerance
                            </Text>
                            <Badge variant="light" size="lg">
                                {options.tolerance}%
                            </Badge>
                        </Group>
                        <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={options.tolerance}
                            onChange={(tolerance) => setOptions((o) => ({ ...o, tolerance }))}
                            label={null}
                            marks={[
                                { value: 0, label: "0" },
                                { value: 50, label: "50" },
                                { value: 100, label: "100" },
                            ]}
                            mb={36}
                            thumbLabel="Detection tolerance"
                        />
                        <Text size="xs" c="dimmed">
                            Higher values also trim dark, noisy edges.
                        </Text>
                    </Paper>

                    {/* Output format */}
                    <Paper withBorder p="md">
                        <Select
                            label="Output format"
                            data={FORMATS}
                            value={options.output_format}
                            onChange={(v) => v && setOptions((o) => ({ ...o, output_format: v }))}
                            allowDeselect={false}
                            leftSection={<FileImageIcon size={18} />}
                            fw={600}
                            styles={{ label: { fontWeight: 600, marginBottom: 8 } }}
                        />
                    </Paper>

                    {/* Toggles */}
                    <Paper withBorder p="md">
                        <Stack gap="md">
                            <Switch
                                label="Padding"
                                description="Adds a 10px buffer around the crop edge"
                                labelPosition="left"
                                styles={{ ...switchStyles, label: { fontWeight: 600 } }}
                                checked={options.padding}
                                onChange={(e) => {
                                    const padding = e.currentTarget.checked;
                                    setOptions((o) => ({ ...o, padding }));
                                }}
                                thumbIcon={<ArrowsOutSimpleIcon size={10} weight="bold" />}
                            />

                            <Divider />

                            <Switch
                                color="red"
                                label="Delete originals"
                                description={
                                    options.delete_original ? (
                                        <Text component="span" inherit c="red" fw={500}>
                                            Source files are permanently deleted after processing
                                        </Text>
                                    ) : (
                                        "Removes source files after processing"
                                    )
                                }
                                labelPosition="left"
                                styles={{ ...switchStyles, label: { fontWeight: 600 } }}
                                checked={options.delete_original}
                                onChange={(e) => {
                                    const delete_original = e.currentTarget.checked;
                                    if (
                                        delete_original &&
                                        !window.confirm(
                                            "Delete Originals permanently removes source files after a successful crop. Continue?",
                                        )
                                    ) {
                                        return;
                                    }
                                    setOptions((o) => ({ ...o, delete_original }));
                                }}
                                thumbIcon={<TrashIcon size={10} weight="bold" />}
                            />
                        </Stack>
                    </Paper>
                </Stack>
            </ScrollArea>

            {/* Process action */}
            <Box
                p="md"
                style={{
                    borderTop: "1px solid var(--mantine-color-default-border)",
                    background: "var(--mantine-color-body)",
                }}
            >
                {isProcessing && (
                    <Stack gap={6} mb="sm">
                        <Group justify="space-between" wrap="nowrap" gap="xs">
                            <Text size="xs" c="dimmed" truncate>
                                {progressMsg || "Processing…"}
                            </Text>
                            <Text size="xs" fw={600}>
                                {Math.round(progress)}%
                            </Text>
                        </Group>
                        <Progress value={progress} size="sm" animated radius="xl" />
                    </Stack>
                )}

                <Button
                    fullWidth
                    size="lg"
                    onClick={onProcessAll}
                    disabled={!canProcess && !isProcessing}
                    loading={isProcessing}
                    leftSection={<LightningIcon size={20} weight="fill" />}
                    rightSection={
                        hasFiles ? (
                            <Group gap={6} wrap="nowrap">
                                <Badge variant="white" size="sm" circle={filesCount < 10}>
                                    {filesCount}
                                </Badge>
                                <CaretRightIcon size={16} weight="bold" />
                            </Group>
                        ) : undefined
                    }
                    justify="space-between"
                >
                    {isProcessing ? "Processing" : "Process files"}
                </Button>

                {!hasFiles && !isProcessing && (
                    <Text size="xs" c="dimmed" ta="center" mt="xs">
                        Add files to get started
                    </Text>
                )}
            </Box>
        </Stack>
    );
}
