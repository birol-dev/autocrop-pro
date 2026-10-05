import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import "@fontsource-variable/inter";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dropzone/styles.css";
import "./global.css";

import { Providers } from "./providers";
import CropperPage from "./cropper/CropperPage";

const root = document.getElementById("root") as HTMLElement;
const app = (
  <StrictMode>
    <Providers>
      <CropperPage />
    </Providers>
  </StrictMode>
);

if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
