import { CheckCircleIcon, ClockIcon, WarningCircleIcon } from "@phosphor-icons/react";

import type { ItemStatus } from "../types";
import classes from "./StatusBadge.module.css";

const LABEL: Record<ItemStatus, string> = {
  queued: "Queued",
  detecting: "Detecting",
  ready: "Crop ready",
  processing: "Processing",
  done: "Done",
  error: "Error",
};

type Props = { status: ItemStatus; size?: "xs" | "sm" };

/** Status label for a queue item; rendered on top of a thumbnail, so it keeps its own scrim. */
export default function StatusBadge({ status, size = "sm" }: Props) {
  const busy = status === "detecting" || status === "processing";
  const Icon =
    status === "ready" || status === "done"
      ? CheckCircleIcon
      : status === "error"
        ? WarningCircleIcon
        : ClockIcon;

  return (
    <span className={classes.badge} data-status={status} data-size={size}>
      {busy ? (
        <span className={classes.spinner} aria-hidden="true" />
      ) : (
        <Icon size={11} weight="bold" aria-hidden="true" />
      )}
      {LABEL[status]}
    </span>
  );
}
