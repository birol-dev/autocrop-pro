import { notifications } from "@mantine/notifications";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";

export function notifyError(message: string, title = "Something went wrong") {
    notifications.show({
        color: "red",
        title,
        message,
        icon: <WarningCircleIcon size={20} weight="fill" />,
        autoClose: 6000,
    });
}

export function notifySuccess(message: string, title?: string) {
    notifications.show({
        color: "teal",
        title,
        message,
        icon: <CheckCircleIcon size={20} weight="fill" />,
        autoClose: 3500,
    });
}
