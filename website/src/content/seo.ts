import { FAQS } from "./faq";
import { STEPS } from "./steps";
import { GITHUB_URL, LAST_UPDATED_ISO, RELEASES_URL, SITE_URL, VERSION } from "./site";

const ORG_ID = `${SITE_URL}/#organization`;

const cropperApp = {
  "@type": "WebApplication",
  "@id": `${SITE_URL}/cropper/#app`,
  name: "AutoCrop Pro Web Cropper",
  url: `${SITE_URL}/cropper/`,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern browser with Canvas support",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  isAccessibleForFree: true,
  license: "https://opensource.org/licenses/MIT",
  description:
    "Client-side browser tool that detects and crops black borders and letterboxes from images and videos. Files never leave the tab.",
  featureList: "In-tab processing, histogram crop detection, live preview, batch download, video crop via ffmpeg.wasm",
  publisher: { "@id": ORG_ID },
};

/** Structured data for `/` — generated from the same content the page renders. */
export function landingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "AutoCrop Pro",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo-app.png`,
        sameAs: [GITHUB_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "AutoCrop Pro",
        description:
          "Free offline Windows app and in-browser cropper for batch cropping black borders and letterboxes from images and videos.",
        publisher: { "@id": ORG_ID },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: "AutoCrop Pro",
        url: `${SITE_URL}/`,
        image: `${SITE_URL}/logo-app.png`,
        operatingSystem: "Windows 10, Windows 11",
        applicationCategory: "MultimediaApplication",
        applicationSubCategory: "Video Editing Software",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        description:
          "A native Windows desktop app and a matching in-browser cropper that automatically detect and crop black borders, letterboxes, and pillarboxes from images and videos. The app uses Rust parallel processing and FFmpeg cropdetect; the web tool runs entirely in the tab.",
        softwareVersion: VERSION,
        license: "https://opensource.org/licenses/MIT",
        downloadUrl: RELEASES_URL,
        featureList:
          "Batch crop, offline processing, in-browser cropper, live preview, tolerance slider, parallel Rust backend, FFmpeg cropdetect for video",
        requirements: "WebView2 Runtime; FFmpeg on PATH for video support",
        author: { "@id": ORG_ID },
      },
      cropperApp,
      {
        "@type": "HowTo",
        name: "How to batch crop black borders with AutoCrop Pro",
        description: "Three-step workflow to remove letterboxes from hundreds of images and videos on Windows.",
        step: STEPS.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name === "Preview & tune" ? "Preview and tune" : s.name,
          text: s.text,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.text },
        })),
      },
    ],
  };
}

/** Structured data for `/cropper/`. */
export function cropperJsonLd() {
  const { "@id": _id, publisher: _publisher, ...rest } = cropperApp;
  return { "@context": "https://schema.org", ...rest };
}

/** sitemap.xml, generated at build time so `lastmod` follows LAST_UPDATED_ISO. */
export function buildSitemap() {
  const entries = [
    { loc: `${SITE_URL}/`, changefreq: "monthly", priority: "1.0" },
    { loc: `${SITE_URL}/cropper/`, changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/llms.txt`, changefreq: "monthly", priority: "0.5" },
    { loc: `${SITE_URL}/pricing.md`, changefreq: "yearly", priority: "0.5" },
  ];
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${LAST_UPDATED_ISO}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
