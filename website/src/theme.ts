import { mergeThemeOverrides, createTheme } from "@mantine/core";
import { theme as appTheme } from "@app/theme";

/**
 * The marketing site uses the desktop app's theme (violet brand, Inter, radii,
 * component defaults) and only bumps the heading scale up for big hero type.
 */
export const siteTheme = mergeThemeOverrides(
  appTheme,
  createTheme({
    headings: {
      sizes: {
        h1: { fontSize: "clamp(2.5rem, 1.5rem + 3.6vw, 4.25rem)", lineHeight: "1.04", fontWeight: "780" },
        h2: { fontSize: "clamp(1.75rem, 1.25rem + 1.7vw, 2.75rem)", lineHeight: "1.1", fontWeight: "720" },
        h3: { fontSize: "1.2rem", lineHeight: "1.3" },
        h4: { fontSize: "1rem", lineHeight: "1.35" },
      },
    },
    other: { headerHeight: 68 },
  }),
);
