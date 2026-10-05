import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import "@fontsource-variable/inter";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./global.css";

import { Providers } from "./providers";
import LandingPage from "./landing/LandingPage";

const root = document.getElementById("root") as HTMLElement;
const app = (
  <StrictMode>
    <Providers>
      <LandingPage />
    </Providers>
  </StrictMode>
);

// Prerendered at build time -> hydrate; in `npm run website` (dev) -> render.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
