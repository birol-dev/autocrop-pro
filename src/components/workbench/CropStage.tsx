import { useRef, useState } from "react";
import { ImageSquareIcon } from "@phosphor-icons/react";

import classes from "./CropStage.module.css";

type Crop = { x: number; y: number; w: number; h: number };

type CropStageProps = {
    src?: string;
    type: "image" | "video";
    name: string;
    /** The crop to draw. A zero-sized one means detection found nothing to go on. */
    crop: Crop | null;
    /** A new crop is on its way: keep showing the last one so the marks glide instead of blinking. */
    pending: boolean;
    /** The frame's real size where the caller knows it better than the rendered media does. */
    frame?: { w: number; h: number } | null;
    /** Pixels to grow `crop` by before drawing it, for a caller holding the unpadded crop. */
    padding?: number;
    error?: string | null;
};

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/**
 * The picture with its crop marks. Render with `key={file id}` so its measured size and
 * remembered crop reset per file. The stage takes the media's own aspect ratio and fits
 * itself inside whatever space its parent gives it.
 */
export default function CropStage({ src, type, name, crop, pending, frame, padding, error }: CropStageProps) {
    const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
    const [failed, setFailed] = useState(false);
    const lastCrop = useRef<Crop | null>(null);

    const size = frame && frame.w > 0 && frame.h > 0 ? frame : measured;
    let usable = crop && crop.w > 0 && crop.h > 0 ? crop : null;
    if (usable && padding && size) {
        const x = Math.max(0, usable.x - padding);
        const y = Math.max(0, usable.y - padding);
        usable = {
            x,
            y,
            w: Math.min(size.w, usable.x + usable.w + padding) - x,
            h: Math.min(size.h, usable.y + usable.h + padding) - y,
        };
    }
    if (usable) lastCrop.current = usable;
    const shown = usable ?? (pending ? lastCrop.current : null);

    const whole = shown && size ? shown.w >= size.w && shown.h >= size.h : false;
    const trimmed = shown && size ? Math.max(0, Math.round((1 - (shown.w * shown.h) / (size.w * size.h)) * 100)) : 0;

    let outcome = "";
    if (error) outcome = "This file has a problem";
    else if (pending) outcome = "Looking for bars…";
    else if (usable && size) outcome = whole ? "No bars found" : `${trimmed}% trimmed`;
    else if (crop) outcome = "No bars found";

    return (
        <div className={classes.root}>
            <div className={classes.viewport}>
                {src && !failed ? (
                    <div
                        className={classes.stage}
                        style={{ "--ar": size ? size.w / size.h : 16 / 9 } as React.CSSProperties}
                    >
                        {type === "video" ? (
                            <video
                                className={classes.media}
                                src={src}
                                autoPlay
                                muted
                                loop
                                playsInline
                                onLoadedMetadata={(e) => setMeasured({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })}
                                onError={() => setFailed(true)}
                            />
                        ) : (
                            <img
                                className={classes.media}
                                src={src}
                                alt={name}
                                onLoad={(e) => setMeasured({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                                onError={() => setFailed(true)}
                            />
                        )}

                        {shown && size && !whole && (
                            <div
                                className={classes.crop}
                                data-testid="crop-overlay"
                                style={{
                                    left: pct(shown.x, size.w),
                                    top: pct(shown.y, size.h),
                                    width: pct(shown.w, size.w),
                                    height: pct(shown.h, size.h),
                                }}
                            >
                                {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                                    <span key={pos} className={classes.mark} data-pos={pos} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={classes.failed}>
                        <ImageSquareIcon size={36} aria-hidden="true" />
                        <p>{error ? "No preview for this file." : "No preview for this file. It can still be cropped."}</p>
                    </div>
                )}
            </div>

            <p className={classes.caption} aria-live="polite">
                <span className={classes.dims}>
                    {size ? `${size.w} × ${size.h}` : "—"}
                    {shown && size && !whole && (
                        <>
                            <span className={classes.arrow}> → </span>
                            <span className={classes.after}>
                                {shown.w} × {shown.h}
                            </span>
                        </>
                    )}
                </span>
                <span data-error={error ? true : undefined} className={classes.outcome}>
                    {outcome}
                </span>
            </p>
        </div>
    );
}
