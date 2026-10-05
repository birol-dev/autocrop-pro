import { ActionIcon, Burger, Button, Drawer, Group, Stack, Tooltip } from "@mantine/core";
import { useDisclosure, useWindowScroll } from "@mantine/hooks";
import { DownloadSimpleIcon, GithubLogoIcon } from "@phosphor-icons/react";

import { GITHUB_URL, NAV_LINKS, RELEASES_URL } from "../content/site";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import classes from "./SiteHeader.module.css";

type SiteHeaderProps = {
  /** Highlights the matching nav link. */
  current?: "cropper";
};

export default function SiteHeader({ current }: SiteHeaderProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [scroll] = useWindowScroll();

  return (
    <>
      <header className={classes.header} data-scrolled={scroll.y > 8 || undefined}>
        <div className={classes.inner}>
          <Logo />

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

          <Group gap="xs" wrap="nowrap" className={classes.actions}>
            <Tooltip label="Source on GitHub" position="bottom">
              <ActionIcon
                component="a"
                href={GITHUB_URL}
                variant="default"
                size="lg"
                radius="md"
                aria-label="AutoCrop Pro on GitHub"
                visibleFrom="xs"
              >
                <GithubLogoIcon size={18} />
              </ActionIcon>
            </Tooltip>
            <ThemeToggle />
            <Button
              component="a"
              href={RELEASES_URL}
              visibleFrom="sm"
              leftSection={<DownloadSimpleIcon size={16} weight="bold" />}
            >
              Download free
            </Button>
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" aria-label="Toggle navigation menu" />
          </Group>
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
      >
        <Stack gap={4} component="nav" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={classes.drawerLink} onClick={close}>
              {link.label}
            </a>
          ))}
          <Button
            component="a"
            href={RELEASES_URL}
            mt="md"
            size="md"
            leftSection={<DownloadSimpleIcon size={18} weight="bold" />}
            onClick={close}
          >
            Download free
          </Button>
          <Button
            component="a"
            href={GITHUB_URL}
            variant="default"
            size="md"
            leftSection={<GithubLogoIcon size={18} />}
            onClick={close}
          >
            View on GitHub
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}
