import pkg from "../../../package.json";

export const SITE_URL = "https://autocrop.birol.tech";
export const GITHUB_URL = "https://github.com/eact6/autocrop-pro";
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const VERSION = pkg.version;

/** Bump when page copy changes: shown on the page, in the footer and in sitemap.xml. */
export const LAST_UPDATED_ISO = "2026-10-06";
export const LAST_UPDATED = "October 6, 2026";

export const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Try it", href: "/cropper/" },
  { label: "Compare", href: "/#compare-tools" },
  { label: "FAQ", href: "/#faq" },
] as const;
