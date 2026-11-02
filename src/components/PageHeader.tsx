import type { ReactNode } from "react";
import { Group, Title } from "@mantine/core";

import classes from "./PageHeader.module.css";

type PageHeaderProps = {
    title: string;
    count?: number;
    actions?: ReactNode;
};

/** The centred serif title at the top of a screen, with its count faded and its actions below. */
export default function PageHeader({ title, count, actions }: PageHeaderProps) {
    return (
        <header className={classes.root}>
            <Title order={1} className={classes.title}>
                {title}
                {!!count && <span className={classes.count}> {count}</span>}
            </Title>
            {actions && <Group gap="xs" justify="center">{actions}</Group>}
        </header>
    );
}
