import { useState, useEffect, useCallback } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { Button, Modal, Skeleton, Title } from "@mantine/core";
import { ArrowsClockwiseIcon, FolderOpenIcon } from "@phosphor-icons/react";
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

    // Empty state
    if (loaded && files.length === 0) {
        return (
            <div className={classes.empty}>
                <Title order={1} className={classes.emptyTitle}>
                    Nothing here yet.
                    <br />
                    <span className={classes.fade}>Cropped files land here.</span>
                </Title>
                <Button size="md" onClick={onGoToQueue}>
                    Go to the queue
                </Button>
            </div>
        );
    }

    return (
        <div className={classes.page}>
            <PageHeader
                title="Outputs"
                count={files.length}
                actions={
                    <>
                        <Button variant="default" leftSection={<FolderOpenIcon size={16} />} onClick={handleOpenFolder}>
                            Open folder
                        </Button>
                        <Button
                            variant="subtle"
                            color="gray"
                            leftSection={<ArrowsClockwiseIcon size={16} />}
                            onClick={load}
                            loading={loading && loaded}
                        >
                            Refresh
                        </Button>
                    </>
                }
            />

            {/* First load: skeleton grid */}
            {!loaded && (
                <div className={classes.grid}>
                    {Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} height={150} radius={10} />
                    ))}
                </div>
            )}

            {/* Grid */}
            {loaded && (
                <ul className={classes.grid}>
                    {files.map((file) => (
                        <li key={file.path}>
                            <button
                                type="button"
                                className={classes.item}
                                aria-label={`Preview ${file.name}`}
                                onClick={() => setLightbox(file)}
                                onDoubleClick={() => handleReveal(file)}
                            >
                                <span className={classes.frame}>
                                    <MediaThumb
                                        src={convertFileSrc(file.path)}
                                        type={file.file_type === "video" ? "video" : "image"}
                                        name={file.name}
                                        ratio={16 / 10}
                                        lazy
                                    />
                                </span>
                                <span className={classes.text}>
                                    <span className={classes.name} title={file.name}>
                                        {file.name}
                                    </span>
                                    <span className={classes.meta}>{timeAgo(file.modified_at)}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Lightbox */}
            <Modal
                opened={!!lightbox}
                onClose={() => setLightbox(null)}
                size="min(1040px, 94vw)"
                overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
                transitionProps={{ transition: "pop", duration: 150 }}
                classNames={{ content: classes.lightboxContent, header: classes.lightboxHeader, title: classes.lightboxTitle }}
                title={lightbox?.name}
            >
                {lightbox && (
                    <>
                        <div className={classes.lightboxStage}>
                            {lightbox.file_type === "video" ? (
                                <video className={classes.lightboxMedia} src={convertFileSrc(lightbox.path)} controls autoPlay muted />
                            ) : (
                                <img className={classes.lightboxMedia} src={convertFileSrc(lightbox.path)} alt={lightbox.name} />
                            )}
                        </div>
                        <div className={classes.lightboxFoot}>
                            <span>{timeAgo(lightbox.modified_at)}</span>
                            <Button leftSection={<FolderOpenIcon size={16} />} onClick={() => handleReveal(lightbox)}>
                                Show in Explorer
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
