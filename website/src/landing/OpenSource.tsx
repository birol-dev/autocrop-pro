import { Button, Group, List, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { ArrowUpRightIcon, CheckIcon, DownloadSimpleIcon, GithubLogoIcon } from "@phosphor-icons/react";

import { GITHUB_URL, RELEASES_URL } from "../content/site";
import { Section } from "../components/Section";
import classes from "./OpenSource.module.css";

const POINTS = [
  "Full source code public on GitHub",
  "MIT License — use it commercially, modify freely",
  "Built with Rust + Tauri — no hidden telemetry",
];

export default function OpenSource() {
  return (
    <Section id="open-source" labelledBy="oss-title">
      <Paper withBorder radius="xl" className={classes.panel} data-reveal>
        <div className={classes.grid}>
          <Stack gap="md">
            <Text className={classes.eyebrow}>Open source</Text>
            <Title order={2} id="oss-title" style={{ letterSpacing: "-0.025em", textWrap: "balance" }}>
              Free forever. Inspect everything.
            </Title>
            <Text c="dimmed" fz="lg" lh={1.6}>
              No subscriptions, no license keys, no black-box uploads. AutoCrop Pro is MIT-licensed — read the Rust
              backend on GitHub, fork it, contribute fixes, and ship your own builds.
            </Text>
            <List
              spacing="xs"
              size="md"
              center
              mt="xs"
              icon={
                <ThemeIcon size={22} radius="xl" color="teal" variant="light">
                  <CheckIcon size={13} weight="bold" />
                </ThemeIcon>
              }
            >
              {POINTS.map((p) => (
                <List.Item key={p}>{p}</List.Item>
              ))}
            </List>
          </Stack>

          <Stack gap="sm" className={classes.actions}>
            <Button
              component="a"
              href={GITHUB_URL}
              size="lg"
              variant="default"
              leftSection={<GithubLogoIcon size={20} weight="fill" />}
              rightSection={<ArrowUpRightIcon size={16} weight="bold" />}
            >
              View source on GitHub
            </Button>
            <Button
              component="a"
              href={RELEASES_URL}
              size="lg"
              leftSection={<DownloadSimpleIcon size={20} weight="bold" />}
            >
              Download latest release
            </Button>
            <Group gap={6} justify="center" c="dimmed" fz="xs" mt={4}>
              <span>MIT licensed</span>
              <span aria-hidden="true">·</span>
              <span>Windows 10/11</span>
            </Group>
          </Stack>
        </div>
      </Paper>
    </Section>
  );
}
