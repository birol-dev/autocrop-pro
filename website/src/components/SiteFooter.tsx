import { GithubLogoIcon } from "@phosphor-icons/react";

import { GITHUB_URL, LAST_UPDATED, RELEASES_URL } from "../content/site";
import Logo from "./Logo";
import classes from "./SiteFooter.module.css";

type FooterLink = { label: string; href: string };

const PRODUCT: FooterLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Crop in browser", href: "/cropper/" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Crop simulator", href: "/#simulator" },
  { label: "Compare", href: "/#compare-tools" },
  { label: "FAQ", href: "/#faq" },
];

const DEVELOPER: FooterLink[] = [
  { label: "GitHub", href: GITHUB_URL },
  { label: "Releases", href: RELEASES_URL },
  { label: "MIT License", href: "https://opensource.org/licenses/MIT" },
  { label: "llms.txt", href: "/llms.txt" },
  { label: "Pricing", href: "/pricing.md" },
];

function Column({ title, links, label }: { title: string; links: FooterLink[]; label: string }) {
  return (
    <nav className={classes.column} aria-label={label}>
      <p className={classes.columnTitle}>{title}</p>
      {links.map((l) => (
        <a key={l.href} href={l.href} className={classes.link}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}

export default function SiteFooter() {
  return (
    <footer className={classes.footer} data-tone="black" data-mantine-color-scheme="dark">
      <div className={classes.inner}>
        <div className={classes.grid}>
          <div className={classes.brand}>
            <Logo size={32} />
            <p className={classes.description}>
              Open-source cropper for black borders on images and videos. Use it in the browser or as a Windows app.
              Local, fast, and free forever.
            </p>
            <a href={GITHUB_URL} className={classes.repo}>
              <GithubLogoIcon size={18} />
              eact6/autocrop-pro
            </a>
          </div>
          <Column title="Product" links={PRODUCT} label="Footer navigation" />
          <Column title="Developer" links={DEVELOPER} label="Developer links" />
          <div className={classes.meta}>
            <p>Updated {LAST_UPDATED}</p>
            <p>MIT · Open Source · Web + Rust/Tauri</p>
          </div>
        </div>
      </div>

      <div className={classes.giant} aria-hidden="true">
        <span>AutoCrop Pro</span>
      </div>

      <div className={classes.inner}>
        <p className={classes.copyright}>© 2026 AutoCrop Pro</p>
      </div>
    </footer>
  );
}
