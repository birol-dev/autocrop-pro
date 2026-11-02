import { mergeThemeOverrides, createTheme } from "@mantine/core";
import { theme as appTheme } from "@app/theme";

/**
 * The desktop app's theme (monochrome, serif headings, pills) with the site's
 * bigger editorial headline sizes on top. See website/DESIGN.md.
 */
export const siteTheme = mergeThemeOverrides(
  appTheme,
  createTheme({
    headings: {
      sizes: {
        h1: { fontSize: "clamp(2.75rem, 1.75rem + 5.2vw, 7.5rem)", lineHeight: "0.98", fontWeight: "200" },
        h2: { fontSize: "clamp(2.5rem, 1.6rem + 3.8vw, 5.75rem)", lineHeight: "1.02", fontWeight: "200" },
        h3: { fontSize: "clamp(1.5rem, 1.3rem + 0.6vw, 2rem)", lineHeight: "1.15", fontWeight: "300" },
      },
    },
    other: { headerHeight: 72 },
  }),
);
