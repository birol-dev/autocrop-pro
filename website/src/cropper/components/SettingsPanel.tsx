import { Badge, Box, Button, Group, Paper, Progress, Select, Slider, Stack, Switch, Text, Title } from "@mantine/core";
import { ArrowsOutSimpleIcon, CaretRightIcon, FileImageIcon, LightningIcon } from "@phosphor-icons/react";

import type { Options, OutputFormat, Progress as ProgressState } from "../types";

type Props = {
  options: Options;
  fileCount: number;
  processing: boolean;
  progress: ProgressState;
  onTolerance: (v: number) => void;
  onPadding: (v: boolean) => void;
  onFormat: (v: OutputFormat) => void;
  onProcess: () => void;
};

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "same", label: "Same as source" },
  { value: "png", label: "PNG (Lossless)" },
  { value: "jpg", label: "JPEG (Compressed)" },
  { value: "webp", label: "WebP" },
];

// Label on the left, switch on the right.
const switchStyles = {
  body: { justifyContent: "space-between", alignItems: "center", width: "100%" },
  labelWrapper: { flex: 1 },
  label: { fontWeight: 600 },
} as const;

export default function SettingsPanel({
  options,
  fileCount,
  processing,
  progress,
  onTolerance,
  onPadding,
  onFormat,
  onProcess,
}: Props) {
  const hasFiles = fileCount > 0;
  const pct = Math.round(progress.ratio * 100);

  return (
    <Stack gap={0}>
      <Stack gap="md" p="md">
        <div>
          <Title order={3}>Export settings</Title>
          <Text size="sm" c="dimmed" mt={2}>
            Applied to every file in the queue.
          </Text>
        </div>

        <Paper withBorder p="md">
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="sm" id="tolerance-label">
              Detection tolerance
            </Text>
            <Badge variant="light" size="lg" style={{ fontVariantNumeric: "tabular-nums" }}>
              {options.tolerance}%
            </Badge>
          </Group>
          <Slider
            min={0}
            max={100}
            step={1}
            value={options.tolerance}
            onChange={onTolerance}
            disabled={processing}
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
            Higher values treat more dark pixels as border.
          </Text>
        </Paper>

        <Paper withBorder p="md">
          <Select
            label="Image output format"
            data={FORMATS}
            value={options.outputFormat}
            onChange={(v) => v && onFormat(v as OutputFormat)}
            allowDeselect={false}
            disabled={processing}
            leftSection={<FileImageIcon size={18} />}
            styles={{ label: { fontWeight: 600, marginBottom: 8 } }}
            comboboxProps={{ withinPortal: true }}
          />
          <Text size="xs" c="dimmed" mt={8}>
            Videos keep MP4 or WebM. GIF exports as PNG.
          </Text>
        </Paper>

        <Paper withBorder p="md">
          <Switch
            label="10px padding"
            description="Keep a buffer so captions are not clipped"
            labelPosition="left"
            styles={switchStyles}
            checked={options.padding}
            disabled={processing}
            onChange={(e) => onPadding(e.currentTarget.checked)}
            thumbIcon={<ArrowsOutSimpleIcon size={10} weight="bold" />}
          />
        </Paper>
      </Stack>

      <Box p="md" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
        {progress.visible && (
          <Stack gap={6} mb="sm" role="status" aria-live="polite">
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Text size="xs" c="dimmed" truncate>
                {progress.message || "Working…"}
              </Text>
              <Text size="xs" fw={600}>
                {pct}%
              </Text>
            </Group>
            <Progress value={pct} size="sm" animated radius="xl" aria-label="Processing progress" />
          </Stack>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={onProcess}
          disabled={!hasFiles}
          loading={processing}
          leftSection={<LightningIcon size={20} weight="fill" />}
          rightSection={
            hasFiles ? (
              <Group gap={6} wrap="nowrap">
                <Badge variant="white" size="sm" circle={fileCount < 10}>
                  {fileCount}
                </Badge>
                <CaretRightIcon size={16} weight="bold" />
              </Group>
            ) : undefined
          }
          justify="space-between"
        >
          {processing ? "Processing" : "Process files"}
        </Button>

        {!hasFiles && !processing && (
          <Text size="xs" c="dimmed" ta="center" mt="xs">
            Add files to get started
          </Text>
        )}
      </Box>
    </Stack>
  );
}
