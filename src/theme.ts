import { createTheme, type MantineColorsTuple } from "@mantine/core";

// The frame is monochrome so the media supplies all of the colour.
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

const fontStack =
    "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const serif = "'Newsreader Variable', 'Iowan Old Style', Georgia, 'Times New Roman', serif";

export const theme = createTheme({
    primaryColor: "ink",
    primaryShade: { light: 8, dark: 0 },
    colors: { ink },
    autoContrast: true,

    fontFamily: fontStack,
    fontFamilyMonospace: "ui-monospace, 'Cascadia Code', 'SF Mono', Consolas, monospace",
    headings: {
        fontFamily: serif,
        fontWeight: "200",
        sizes: {
            h1: { fontSize: "clamp(2.5rem, 1.5rem + 3vw, 4rem)", lineHeight: "1.02", fontWeight: "200" },
            h2: { fontSize: "2rem", lineHeight: "1.1", fontWeight: "200" },
            h3: { fontSize: "1.5rem", lineHeight: "1.15", fontWeight: "300" },
            h4: { fontSize: "1rem", lineHeight: "1.35", fontWeight: "500" },
        },
    },

    defaultRadius: "md",
    radius: { xs: "8px", sm: "12px", md: "16px", lg: "24px", xl: "32px" },
    cursorType: "pointer",
    black: "#141414",

    components: {
        Button: { defaultProps: { fw: 400, radius: 999 } },
        ActionIcon: { defaultProps: { radius: 999 } },
        Badge: { defaultProps: { fw: 400, tt: "none", radius: 999 } },
        Tooltip: { defaultProps: { withArrow: true, openDelay: 250, fz: "xs" } },
        Paper: { defaultProps: { radius: "lg" } },
        Card: { defaultProps: { radius: "lg" } },
        Modal: { defaultProps: { radius: "lg", centered: true } },
        Select: { defaultProps: { radius: 999 } },
        TextInput: { defaultProps: { radius: 999 } },
        NumberInput: { defaultProps: { radius: 999 } },
        SegmentedControl: { defaultProps: { radius: 999 } },
    },
});
