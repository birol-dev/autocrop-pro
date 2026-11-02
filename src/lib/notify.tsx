import { notifications } from "@mantine/notifications";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";

// Fixed shades, not colour names: the theme's dark primaryShade of 0 would turn any named colour
// near white behind the toast's white icon.
const RED = "var(--mantine-color-red-8)";
const GRAY = "var(--mantine-color-gray-7)";

export function notifyError(message: string, title = "Something went wrong") {
    notifications.show({
        color: RED,
        title,
        message,
        icon: <WarningCircleIcon size={20} weight="fill" />,
        autoClose: 6000,
    });
}

export function notifyWarning(message: string, title?: string) {
    notifications.show({
        color: GRAY,
        title,
        message,
        icon: <WarningCircleIcon size={20} weight="fill" />,
        autoClose: 6000,
    });
}

export function notifySuccess(message: string, title?: string) {
    notifications.show({
        color: GRAY,
        title,
        message,
        icon: <CheckCircleIcon size={20} weight="fill" />,
        autoClose: 3500,
    });
}
