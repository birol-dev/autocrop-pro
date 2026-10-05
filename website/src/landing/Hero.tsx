import { Badge, Box, Button, Container, Group, Text, ThemeIcon, Title } from "@mantine/core";
import {
  ArrowRightIcon,
  BrowserIcon,
  CpuIcon,
  CrosshairSimpleIcon,
  SealCheckIcon,
  WindowsLogoIcon,
} from "@phosphor-icons/react";

import { RELEASES_URL } from "../content/site";
import AppMock from "./AppMock";
import classes from "./Hero.module.css";

const CHECKS = [
  { icon: BrowserIcon, text: "In-browser cropper — files stay in this tab, no account" },
  { icon: CpuIcon, text: "Windows app for 500+ files, Parallel Rust, custom output folders" },
  { icon: CrosshairSimpleIcon, text: "Live crop overlay with a single tolerance slider" },
];

export default function Hero() {
  return (
    <Box component="section" id="hero" className={classes.hero} aria-labelledby="hero-title">
      <Container size={1200} px={{ base: "md", sm: "xl" }}>
        <div className={classes.grid}>
          <div className={classes.copy}>
            <Badge
              size="lg"
              variant="light"
              leftSection={<SealCheckIcon size={14} weight="fill" />}
              tt="uppercase"
              className={classes.eyebrow}
            >
              Open source · MIT · Free forever
            </Badge>

            <Title order={1} id="hero-title" className={classes.title}>
              Strip letterboxes from 500 files —{" "}
              <span className={classes.accent}>without cloud uploads, or FFmpeg scripts</span>
            </Title>

            <Text className={classes.lead} c="dimmed">
              AutoCrop Pro removes letterboxes, pillarboxes, and black bars from images and videos. Crop a few files in
              your browser, or download the Windows app for huge offline batches — files never go to our servers.
            </Text>

            <Group gap="sm" mt="xs">
              <Button component="a" href="/cropper/" size="lg" rightSection={<ArrowRightIcon size={18} weight="bold" />}>
                Crop in your browser
              </Button>
              <Button
                component="a"
                href={RELEASES_URL}
                size="lg"
                variant="default"
                leftSection={<WindowsLogoIcon size={18} weight="fill" />}
              >
                Download for Windows
              </Button>
            </Group>

            <ul className={classes.checks}>
              {CHECKS.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <ThemeIcon size={26} radius="xl" variant="light">
                    <Icon size={15} weight="bold" />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">
                    {text}
                  </Text>
                </li>
              ))}
            </ul>
          </div>

          <div className={classes.visual}>
            <AppMock />
          </div>
        </div>
      </Container>
    </Box>
  );
}
