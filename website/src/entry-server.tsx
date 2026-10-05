import { renderToString } from "react-dom/server";

import { Providers } from "./providers";
import LandingPage from "./landing/LandingPage";
import CropperPage from "./cropper/CropperPage";
import { buildSitemap, cropperJsonLd, landingJsonLd } from "./content/seo";

export type PageName = "landing" | "cropper";

/** Server-render a page to an HTML string (used by scripts/prerender.mjs). */
export function render(page: PageName): string {
  return renderToString(
    <Providers>{page === "landing" ? <LandingPage /> : <CropperPage />}</Providers>,
  );
}

export function jsonLd(page: PageName) {
  return page === "landing" ? landingJsonLd() : cropperJsonLd();
}

export { buildSitemap };
