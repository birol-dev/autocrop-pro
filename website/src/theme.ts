import { mergeThemeOverrides, createTheme, type MantineColorsTuple } from "@mantine/core";
import { theme as appTheme } from "@app/theme";

// The site frame is monochrome so the media supplies all of the colour.
const ink: MantineColorsTuple = [
  "#f4f4f4",
  "#e5e5e2",
  "#cfcfcf",
  "#b6b6b6",
  "#8a8a8a",
  "#5f5f5f",
  "#3a3a3a",
  "#1c1c1c",
  "#141414",
  "#0a0a0a",
];

const serif = "'Newsreader Variable', 'Iowan Old Style', Georgia, 'Times New Roman', serif";

/**
 * Extends the desktop app's theme (Inter, component defaults) with the site's
 * editorial look: thin giant serif headings, one regular-weight sans, pills for
 * every control and very round panels. See website/DESIGN.md.
 */
export const siteTheme = mergeThemeOverrides(
  appTheme,
  createTheme({
    colors: { ink },
    primaryColor: "ink",
    primaryShade: { light: 7, dark: 0 },
    autoContrast: true,
    defaultRadius: "md",
    radius: { xs: "8px", sm: "12px", md: "16px", lg: "24px", xl: "32px" },
    headings: {
      fontFamily: serif,
      fontWeight: "200",
      sizes: {
        h1: { fontSize: "clamp(2.75rem, 1.75rem + 5.2vw, 7.5rem)", lineHeight: "0.98", fontWeight: "200" },
        h2: { fontSize: "clamp(2.5rem, 1.6rem + 3.8vw, 5.75rem)", lineHeight: "1.02", fontWeight: "200" },
        h3: { fontSize: "clamp(1.5rem, 1.3rem + 0.6vw, 2rem)", lineHeight: "1.15", fontWeight: "300" },
        h4: { fontSize: "1rem", lineHeight: "1.35", fontWeight: "500" },
      },
    },
    components: {
      Button: { defaultProps: { fw: 400, radius: 999 } },
      ActionIcon: { defaultProps: { radius: 999 } },
      Badge: { defaultProps: { fw: 400, tt: "none", radius: 999 } },
      Paper: { defaultProps: { radius: "lg" } },
      Card: { defaultProps: { radius: "lg" } },
      Modal: { defaultProps: { radius: "lg", centered: true } },
      Select: { defaultProps: { radius: 999 } },
      TextInput: { defaultProps: { radius: 999 } },
      NumberInput: { defaultProps: { radius: 999 } },
      SegmentedControl: { defaultProps: { radius: 999 } },
    },
    other: { headerHeight: 72 },
  }),
);
