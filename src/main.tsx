import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import "@fontsource-variable/inter";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";

import App from "./App";
import { theme } from "./theme";

async function bootstrap() {
    // Running in a plain browser (no Tauri shell)? Install the dev shim so the
    // UI is fully explorable. Stripped from production builds.
    if (import.meta.env.DEV && !("__TAURI_INTERNALS__" in window)) {
        const { installTauriMock } = await import("./dev/mockTauri");
        installTauriMock();
    }

    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
        <React.StrictMode>
            <MantineProvider theme={theme} defaultColorScheme="auto">
                <Notifications position="bottom-right" limit={4} />
                <App />
            </MantineProvider>
        </React.StrictMode>
    );
}

bootstrap();
