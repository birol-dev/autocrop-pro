import type { ReactNode } from "react";
import { CheckCircleIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";

import MediaThumb from "../MediaThumb";
import { workbench as classes } from "./Workbench";

export type RowState = "idle" | "busy" | "ready" | "error";

type QueueRowProps = {
    name: string;
    meta: ReactNode;
    src?: string;
    type: "image" | "video";
    active: boolean;
    state: RowState;
    error?: string | null;
    disabled: boolean;
    onSelect: () => void;
    onRemove: () => void;
};

/** One file in the queue: thumbnail, name, what we know about it, and how it's doing. */
export default function QueueRow({ name, meta, src, type, active, state, error, disabled, onSelect, onRemove }: QueueRowProps) {
    return (
        <li className={classes.row} data-active={active || undefined}>
            <button type="button" className={classes.rowMain} aria-current={active || undefined} onClick={onSelect}>
                <span className={classes.thumb}>
                    <MediaThumb src={src} type={type} name="" ratio={16 / 9} lazy plain />
                </span>
                <span className={classes.rowText}>
                    <span className={classes.rowName} title={name}>
                        {name}
                    </span>
                    {error ? (
                        <span className={classes.rowError} role="alert" title={error}>
                            {error}
                        </span>
                    ) : (
                        <span className={classes.rowMeta}>{meta}</span>
                    )}
                </span>
                <span className={classes.rowState} data-state={state}>
                    {state === "busy" && <span className={classes.spinner} aria-label="Working" />}
                    {state === "ready" && <CheckCircleIcon size={16} weight="fill" aria-label="Crop ready" />}
                    {state === "error" && <WarningCircleIcon size={16} weight="fill" aria-label="Error" />}
                </span>
            </button>
            <button type="button" className={classes.remove} disabled={disabled} aria-label={`Remove ${name}`} onClick={onRemove}>
                <XIcon size={13} weight="bold" />
            </button>
        </li>
    );
}
