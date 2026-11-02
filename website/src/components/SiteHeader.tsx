import { useEffect, useState } from "react";
import { Burger, Drawer, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DownloadSimpleIcon, GithubLogoIcon } from "@phosphor-icons/react";

import { GITHUB_URL, NAV_LINKS, RELEASES_URL } from "../content/site";
import Logo from "./Logo";
import { Pill } from "./Section";
import ThemeToggle from "./ThemeToggle";
import classes from "./SiteHeader.module.css";

type SiteHeaderProps = {
  /** Highlights the matching nav link. */
  current?: "cropper";
  /** Drops the pills and turns white while the page's `#hero` is behind the header. */
  overHero?: boolean;
};

export default function SiteHeader({ current, overHero }: SiteHeaderProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [onHero, setOnHero] = useState(Boolean(overHero));

  useEffect(() => {
    if (!overHero) return;
    const update = () => {
      const hero = document.getElementById("hero");
      setOnHero(Boolean(hero) && hero!.getBoundingClientRect().bottom > 80);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [overHero]);

  return (
    <>
      <header className={classes.header} data-on-hero={onHero || undefined}>
        <div className={classes.logoPill}>
          <Logo />
        </div>

        <nav className={classes.nav} aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={classes.link}
              aria-current={current === "cropper" && link.href === "/cropper/" ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className={classes.actions}>
          <Tooltip label="Source on GitHub" position="bottom">
            <a href={GITHUB_URL} className={classes.iconLink} aria-label="AutoCrop Pro on GitHub">
              <GithubLogoIcon size={18} />
            </a>
          </Tooltip>
          <ThemeToggle />
          <span className={classes.downloadWrap}>
            <Pill href={RELEASES_URL} icon={<DownloadSimpleIcon size={15} weight="bold" />}>
              Download free
            </Pill>
          </span>
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="md"
            size="md"
            className={classes.burger}
            aria-label="Toggle navigation menu"
          />
        </div>
      </header>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="xs"
        padding="lg"
        title={<Logo size={30} href="/" />}
        hiddenFrom="md"
        overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
        classNames={{
          content: classes.drawer,
          header: classes.drawerHeader,
          title: classes.drawerTitle,
          body: classes.drawerBody,
        }}
      >
        <nav className={classes.drawerNav} aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={classes.drawerLink} onClick={close}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={classes.drawerActions}>
          <Pill href={RELEASES_URL} icon={<DownloadSimpleIcon size={18} weight="bold" />} onClick={close}>
            Download free
          </Pill>
          <Pill href={GITHUB_URL} variant="soft" icon={<GithubLogoIcon size={18} />} onClick={close}>
            View on GitHub
          </Pill>
        </div>
      </Drawer>
    </>
  );
}
