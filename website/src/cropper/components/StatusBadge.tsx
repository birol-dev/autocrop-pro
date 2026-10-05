import { Badge, Loader } from "@mantine/core";
import { CheckCircleIcon, ClockIcon, WarningCircleIcon } from "@phosphor-icons/react";

import type { ItemStatus } from "../types";

const LABEL: Record<ItemStatus, string> = {
  queued: "Queued",
  detecting: "Detecting",
  ready: "Crop ready",
  processing: "Processing",
  done: "Done",
  error: "Error",
};

type Props = { status: ItemStatus; size?: "xs" | "sm" };

/** Status pill for a queue item; rendered on top of a thumbnail, so filled variants stay legible. */
export default function StatusBadge({ status, size = "sm" }: Props) {
  switch (status) {
    case "ready":
    case "done":
      return (
        <Badge size={size} color="teal" variant="filled" leftSection={<CheckCircleIcon size={12} weight="fill" />}>
          {LABEL[status]}
        </Badge>
      );
    case "detecting":
    case "processing":
      return (
        <Badge size={size} color="brand" variant="filled" leftSection={<Loader size={10} color="white" />}>
          {LABEL[status]}
        </Badge>
      );
    case "error":
      return (
        <Badge size={size} color="red" variant="filled" leftSection={<WarningCircleIcon size={12} weight="fill" />}>
          {LABEL[status]}
        </Badge>
      );
    default:
      return (
        <Badge size={size} color="dark" variant="filled" leftSection={<ClockIcon size={12} weight="bold" />}>
          {LABEL[status]}
        </Badge>
      );
  }
}
