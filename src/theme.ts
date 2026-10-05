import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Violet scale anchored on the logo's flower (#7c3aed at shade 6).
const brand: MantineColorsTuple = [
    "#f5f3ff",
    "#ede9fe",
    "#ddd6fe",
    "#c4b5fd",
    "#a78bfa",
    "#8b5cf6",
    "#7c3aed",
    "#6d28d9",
    "#5b21b6",
    "#4c1d95",
];

const fontStack =
    "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

export const theme = createTheme({
    primaryColor: "brand",
    primaryShade: { light: 6, dark: 5 },
    colors: { brand },

    fontFamily: fontStack,
    fontFamilyMonospace: "ui-monospace, 'Cascadia Code', 'SF Mono', Consolas, monospace",
    headings: {
        fontFamily: fontStack,
        fontWeight: "650",
        sizes: {
            h1: { fontSize: "1.75rem", lineHeight: "1.2" },
            h2: { fontSize: "1.375rem", lineHeight: "1.25" },
            h3: { fontSize: "1.125rem", lineHeight: "1.3" },
            h4: { fontSize: "1rem", lineHeight: "1.35" },
        },
    },

    defaultRadius: "md",
    cursorType: "pointer",
    black: "#17171c",

    shadows: {
        xs: "0 1px 2px rgba(17, 17, 26, 0.06)",
        sm: "0 1px 3px rgba(17, 17, 26, 0.08), 0 1px 2px rgba(17, 17, 26, 0.04)",
        md: "0 6px 16px -4px rgba(17, 17, 26, 0.12), 0 2px 4px rgba(17, 17, 26, 0.04)",
        lg: "0 16px 32px -8px rgba(17, 17, 26, 0.18), 0 4px 8px rgba(17, 17, 26, 0.05)",
    },

    components: {
        Button: { defaultProps: { fw: 600 } },
        Badge: { defaultProps: { fw: 600, tt: "none" } },
        Tooltip: { defaultProps: { withArrow: true, openDelay: 250, fz: "xs" } },
        Paper: { defaultProps: { radius: "lg" } },
        Card: { defaultProps: { radius: "lg" } },
        Modal: { defaultProps: { radius: "lg", centered: true } },
    },
});
