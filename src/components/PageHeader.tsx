import type { ReactNode } from "react";
import { Badge, Group, Text, Title } from "@mantine/core";

type PageHeaderProps = {
    title: string;
    description?: ReactNode;
    count?: number;
    actions?: ReactNode;
};

/** Title row used at the top of every screen: title + optional count + right-aligned actions. */
export default function PageHeader({ title, description, count, actions }: PageHeaderProps) {
    return (
        <Group justify="space-between" align="flex-end" wrap="nowrap" gap="md">
            <div style={{ minWidth: 0 }}>
                <Group gap="xs" align="center">
                    <Title order={2}>{title}</Title>
                    {count !== undefined && (
                        <Badge variant="light" size="lg" circle={count < 10} radius="xl">
                            {count}
                        </Badge>
                    )}
                </Group>
                {description && (
                    <Text size="sm" c="dimmed" mt={2}>
                        {description}
                    </Text>
                )}
            </div>
            {actions && <Group gap="xs" wrap="nowrap">{actions}</Group>}
        </Group>
    );
}
