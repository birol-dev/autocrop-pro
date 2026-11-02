import { useState, useEffect, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Button, SegmentedControl, useMantineColorScheme } from "@mantine/core";
import { version } from "../../package.json";
import { notifyError, notifySuccess } from "@/lib/notify";
import PageHeader from "./PageHeader";

import classes from "./SettingsPanel.module.css";

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className={classes.section}>
            <h2 className={classes.sectionTitle}>{title}</h2>
            {children}
        </section>
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
        <div className={classes.page}>
            <PageHeader title="Settings" />

            <Section title="Save cropped files to">
                <p className={classes.path} title={saveLocation}>
                    {saveLocation || "Loading…"}
                </p>
                <div className={classes.actions}>
                    <Button onClick={handleBrowse} loading={loading} disabled={saving}>
                        Choose a folder
                    </Button>
                    <Button variant="subtle" color="gray" onClick={handleReset} disabled={loading} loading={saving}>
                        Use the default
                    </Button>
                </div>
            </Section>

            <Section title="Appearance">
                <SegmentedControl
                    fullWidth
                    classNames={{ root: classes.segments, indicator: classes.indicator }}
                    value={colorScheme}
                    onChange={(v) => setColorScheme(v as "light" | "dark" | "auto")}
                    data={[
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                        { value: "auto", label: "System" },
                    ]}
                />
            </Section>

            <p className={classes.about}>
                <img src="/logo.png" alt="" className={classes.logo} />
                AutoCrop Pro {version}
            </p>
        </div>
    );
}
