import { useState, type ReactNode } from "react";
import { AspectRatio } from "@mantine/core";
import { FilmStripIcon, ImageSquareIcon, PlayIcon } from "@phosphor-icons/react";

import classes from "./MediaThumb.module.css";

type MediaThumbProps = {
    src?: string;
    type: "image" | "video";
    name: string;
    ratio?: number;
    lazy?: boolean;
    /** Overlay content (badges, action buttons) rendered above the media. */
    children?: ReactNode;
};

/**
 * Cover-fit thumbnail for an image or video with a graceful fallback when the
 * file can't be decoded. Shared by the queue and the outputs gallery.
 */
export default function MediaThumb({ src, type, name, ratio = 16 / 10, lazy, children }: MediaThumbProps) {
    const [failed, setFailed] = useState(false);
    const showMedia = !!src && !failed;
    const Fallback = type === "video" ? FilmStripIcon : ImageSquareIcon;

    return (
        <AspectRatio ratio={ratio} className={classes.root}>
            {showMedia ? (
                type === "video" ? (
                    <video
                        className={classes.media}
                        src={`${src}#t=0.1`}
                        preload="metadata"
                        muted
                        onError={() => setFailed(true)}
                    />
                ) : (
                    <img
                        className={classes.media}
                        src={src}
                        alt={name}
                        loading={lazy ? "lazy" : undefined}
                        onError={() => setFailed(true)}
                    />
                )
            ) : (
                <div className={classes.fallback}>
                    <Fallback size={36} weight="duotone" />
                </div>
            )}

            {showMedia && type === "video" && (
                <div className={classes.playOverlay}>
                    <span className={classes.playButton}>
                        <PlayIcon size={16} weight="fill" style={{ marginLeft: 2 }} />
                    </span>
                </div>
            )}

            {children && <div className={classes.overlay}>{children}</div>}
        </AspectRatio>
    );
}
