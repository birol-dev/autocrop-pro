import { useState, useEffect, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
    ActionIcon,
    Badge,
    Button,
    Center,
    Group,
    Image,
    Paper,
    SegmentedControl,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Tooltip,
    useMantineColorScheme,
} from "@mantine/core";
import {
    ArrowCounterClockwiseIcon,
    DesktopIcon,
    FolderOpenIcon,
    FolderSimpleIcon,
    InfoIcon,
    MoonIcon,
    PaletteIcon,
    SunIcon,
} from "@phosphor-icons/react";
import { version } from "../../package.json";
import { notifyError, notifySuccess } from "@/lib/notify";
import PageHeader from "./PageHeader";

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
    return (
        <Paper withBorder p="lg">
            <Group gap="md" align={description ? "flex-start" : "center"} wrap="nowrap" mb="md">
                <ThemeIcon size={40} radius="md" variant="light">
                    {icon}
                </ThemeIcon>
                <div>
                    <Text fw={650}>{title}</Text>
                    {description && (
                        <Text size="sm" c="dimmed">
                            {description}
                        </Text>
                    )}
                </div>
            </Group>
            {children}
        </Paper>
    );
}

export default function SettingsPanel() {
    const [saveLocation, setSaveLocation] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { colorScheme, setColorScheme } = useMantineColorScheme();

    useEffect(() => {
        invoke<string>("get_save_location")
            .then(setSaveLocation)
            .catch(err => notifyError(`Failed to load settings: ${String(err)}`));
    }, []);

    const handleBrowse = async () => {
        setLoading(true);
        try {
            const chosen = await openDialog({
                directory: true,
                multiple: false,
                title: "Select output folder for AutoCrop Pro",
            });
            if (chosen && typeof chosen === "string") {
                setSaving(true);
                await invoke("set_save_location", { path: chosen });
                setSaveLocation(chosen);
                notifySuccess("Save location updated");
            }
        } catch (err) {
            notifyError(`Failed to set location: ${String(err)}`);
        } finally {
            setLoading(false);
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        try {
            await invoke("set_save_location", { path: "" });
            const def = await invoke<string>("get_save_location");
            setSaveLocation(def);
            notifySuccess("Reset to default location");
        } catch (err) {
            notifyError(`Failed to reset: ${String(err)}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Stack gap="lg" maw={680} w="100%" mx="auto">
            <PageHeader title="Settings" description="Where your files go and how the app looks." />

            <Section
                icon={<FolderSimpleIcon size={22} weight="duotone" />}
                title="Output location"
                description="Processed files are saved here. Defaults to Documents/AutoCrop_Output."
            >
                <TextInput
                    readOnly
                    value={saveLocation}
                    placeholder="Loading…"
                    leftSection={<FolderOpenIcon size={16} />}
                    aria-label="Output save location"
                    title={saveLocation}
                    mb="sm"
                />
                <Group gap="sm" wrap="nowrap">
                    <Button
                        flex={1}
                        leftSection={<FolderOpenIcon size={16} />}
                        onClick={handleBrowse}
                        loading={loading}
                        disabled={saving}
                    >
                        Browse…
                    </Button>
                    <Tooltip label="Reset to default">
                        <ActionIcon
                            variant="default"
                            size={36}
                            onClick={handleReset}
                            disabled={loading}
                            loading={saving}
                            aria-label="Reset to default location"
                        >
                            <ArrowCounterClockwiseIcon size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Section>

            <Section
                icon={<PaletteIcon size={22} weight="duotone" />}
                title="Appearance"
                description="Choose a theme, or follow your system setting."
            >
                <SegmentedControl
                    fullWidth
                    value={colorScheme}
                    onChange={(v) => setColorScheme(v as "light" | "dark" | "auto")}
                    data={[
                        { value: "light", label: <Center inline style={{ gap: 8 }}><SunIcon size={16} /> Light</Center> },
                        { value: "dark", label: <Center inline style={{ gap: 8 }}><MoonIcon size={16} /> Dark</Center> },
                        { value: "auto", label: <Center inline style={{ gap: 8 }}><DesktopIcon size={16} /> System</Center> },
                    ]}
                />
            </Section>

            <Section icon={<InfoIcon size={22} weight="duotone" />} title="About">
                <Group wrap="nowrap" align="flex-start" gap="md">
                    <Image src="/logo.png" alt="" w={56} h={56} radius="md" />
                    <Stack gap={6}>
                        <Group gap="xs">
                            <Text fw={650}>AutoCrop Pro</Text>
                            <Badge variant="light">v{version}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                            Automatically detects and removes black or solid-colour borders from images and videos
                            using histogram analysis and FFmpeg's cropdetect filter.
                        </Text>
                    </Stack>
                </Group>
            </Section>
        </Stack>
    );
}
