import { Button, Title } from "@mantine/core";

import classes from "./Dropzone.module.css";

type DropzoneProps = {
    /** A file is currently being dragged over the window (Tauri native drag events). */
    isDragHovering: boolean;
    onBrowseFiles: () => void;
    onBrowseFolder: () => void;
};

/** The empty queue. The whole window takes drops; this is what it says about them. */
export default function Dropzone({ isDragHovering, onBrowseFiles, onBrowseFolder }: DropzoneProps) {
    return (
        <div className={classes.root} data-hover={isDragHovering || undefined}>
            <Title order={1} className={classes.title}>
                {isDragHovering ? (
                    "Let go."
                ) : (
                    <>
                        Drop a folder.
                        <br />
                        <span className={classes.fade}>Lose the black bars.</span>
                    </>
                )}
            </Title>

            <div className={classes.actions}>
                <Button size="md" onClick={onBrowseFiles}>
                    Choose files
                </Button>
                <Button size="md" variant="default" onClick={onBrowseFolder}>
                    Choose a folder
                </Button>
            </div>

            <p className={classes.formats}>Photos and videos. PNG, JPG, WebP, BMP, TIFF, GIF, MP4, MOV, MKV, AVI, WebM.</p>
        </div>
    );
}
