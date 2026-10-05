import type { ReactNode } from "react";
import { Badge, Box, Container, Stack, Text, Title, type MantineColor } from "@mantine/core";

import classes from "./Section.module.css";

type SectionProps = {
  id?: string;
  /** Alternate background band. */
  tint?: boolean;
  children: ReactNode;
  /** Container width in px. */
  size?: number;
  /** Accessible name for the section landmark (id of its heading). */
  labelledBy?: string;
};

export function Section({ id, tint, children, size = 1200, labelledBy }: SectionProps) {
  return (
    <Box
      component="section"
      id={id}
      aria-labelledby={labelledBy}
      className={classes.section}
      data-tint={tint || undefined}
    >
      <Container size={size} px={{ base: "md", sm: "xl" }}>
        {children}
      </Container>
    </Box>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  eyebrowColor?: MantineColor;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
  titleId?: string;
};

export function SectionHeader({ eyebrow, eyebrowColor, title, lead, align = "center", titleId }: SectionHeaderProps) {
  return (
    <Stack gap="sm" align={align === "center" ? "center" : "flex-start"} ta={align} mb={{ base: 36, sm: 56 }} data-reveal>
      {eyebrow && (
        <Badge variant="light" color={eyebrowColor} size="lg" tt="uppercase" className={classes.eyebrow}>
          {eyebrow}
        </Badge>
      )}
      <Title order={2} id={titleId} maw={820} className={classes.title}>
        {title}
      </Title>
      {lead && (
        <Text c="dimmed" fz={{ base: "md", sm: "lg" }} maw={680} lh={1.6}>
          {lead}
        </Text>
      )}
    </Stack>
  );
}

/** Highlighted words inside a heading. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className={classes.accent}>{children}</span>;
}

