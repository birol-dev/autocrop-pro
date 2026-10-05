import type { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { siteTheme } from "./theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={siteTheme} defaultColorScheme="auto">
      <Notifications position="bottom-right" limit={4} />
      {children}
    </MantineProvider>
  );
}
