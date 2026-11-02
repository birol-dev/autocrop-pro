import pkg from "../../../package.json";

export const SITE_URL = "https://autocrop.birol.tech";
export const GITHUB_URL = "https://github.com/birol-dev/autocrop-pro";
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const VERSION = pkg.version;

/** Bump when page copy changes: used as `lastmod` in sitemap.xml. */
export const LAST_UPDATED_ISO = "2026-11-02";

export const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Try it", href: "/cropper/" },
  { label: "FAQ", href: "/#faq" },
] as const;
