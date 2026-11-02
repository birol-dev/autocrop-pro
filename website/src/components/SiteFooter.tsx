import { GITHUB_URL, RELEASES_URL } from "../content/site";
import Logo from "./Logo";
import classes from "./SiteFooter.module.css";

const LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Crop in browser", href: "/cropper/" },
  { label: "FAQ", href: "/#faq" },
  { label: "GitHub", href: GITHUB_URL },
  { label: "Releases", href: RELEASES_URL },
];

export default function SiteFooter() {
  return (
    <footer className={classes.footer} data-tone="black" data-mantine-color-scheme="dark">
      <div className={classes.inner}>
        <Logo size={32} />
        <nav className={classes.links} aria-label="Footer navigation">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={classes.link}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className={classes.giant} aria-hidden="true">
        <span>AutoCrop Pro</span>
      </div>

      <p className={classes.copyright}>© 2026 AutoCrop Pro · MIT License</p>
    </footer>
  );
}
