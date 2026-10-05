import { Group, Text, UnstyledButton } from "@mantine/core";

import classes from "./Logo.module.css";

type LogoProps = { size?: number; href?: string };

export default function Logo({ size = 36, href = "/" }: LogoProps) {
  return (
    <UnstyledButton component="a" href={href} className={classes.root} aria-label="AutoCrop Pro home">
      <Group gap="sm" wrap="nowrap">
        <img src="/logo-icon.png" alt="" width={size} height={size} className={classes.mark} />
        <Text fw={750} fz={size >= 36 ? 20 : 18} lh={1} className={classes.word}>
          AutoCrop <span className={classes.pro}>Pro</span>
        </Text>
      </Group>
    </UnstyledButton>
  );
}
