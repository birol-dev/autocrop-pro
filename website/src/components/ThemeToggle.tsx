import { ActionIcon, Tooltip, useMantineColorScheme } from "@mantine/core";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

import classes from "./ThemeToggle.module.css";

/**
 * Light/dark switch. Both icons are rendered and CSS shows the right one, so the
 * prerendered HTML is correct for either scheme and hydration never mismatches.
 */
export default function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();
  return (
    <Tooltip label="Toggle light / dark" position="bottom">
      <ActionIcon
        variant="default"
        size="lg"
        radius="md"
        onClick={() => toggleColorScheme()}
        aria-label="Toggle color theme"
      >
        <SunIcon size={18} className={classes.sun} />
        <MoonIcon size={18} className={classes.moon} />
      </ActionIcon>
    </Tooltip>
  );
}
