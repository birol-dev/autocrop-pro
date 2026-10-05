import { Anchor, Badge, Box, Container, Divider, Group, Stack, Text } from "@mantine/core";
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
    <Stack gap={8} component="nav" aria-label={label}>
      <Text fw={650} fz="sm">
        {title}
      </Text>
      {links.map((l) => (
        <Anchor key={l.href} href={l.href} fz="sm" c="dimmed" className={classes.link}>
          {l.label}
        </Anchor>
      ))}
    </Stack>
  );
}

export default function SiteFooter() {
  return (
    <Box component="footer" className={classes.footer}>
      <Container size={1200} px={{ base: "md", sm: "xl" }} py={{ base: 48, sm: 64 }}>
        <div className={classes.grid}>
          <Stack gap="md" maw={380}>
            <Logo size={32} />
            <Text c="dimmed" fz="sm" lh={1.65}>
              Open-source cropper for black borders on images and videos. Use it in the browser or as a Windows app.
              Local, fast, and free forever.
            </Text>
            <Anchor href={GITHUB_URL} fz="sm" fw={600} className={classes.gh}>
              <Group gap={6} wrap="nowrap">
                <GithubLogoIcon size={18} />
                eact6/autocrop-pro
              </Group>
            </Anchor>
          </Stack>
          <Column title="Product" links={PRODUCT} label="Footer navigation" />
          <Column title="Developer" links={DEVELOPER} label="Developer links" />
        </div>

        <Divider my="xl" />

        <Group justify="space-between" gap="md">
          <Text size="xs" c="dimmed">
            © 2026 AutoCrop Pro · Updated {LAST_UPDATED}
          </Text>
          <Badge variant="light" size="md">
            MIT · Open Source · Web + Rust/Tauri
          </Badge>
        </Group>
      </Container>
    </Box>
  );
}
