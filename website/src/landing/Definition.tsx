import { Anchor, Code, Group, Text, Title } from "@mantine/core";
import { ClockIcon, GithubLogoIcon } from "@phosphor-icons/react";

import { Section } from "../components/Section";
import { GITHUB_URL, LAST_UPDATED } from "../content/site";

export default function Definition() {
  return (
    <Section id="what-is-autocrop" size={800} labelledBy="what-is-title">
      <div data-reveal>
        <Title order={2} id="what-is-title" mb="md" style={{ letterSpacing: "-0.025em" }}>
          What is AutoCrop Pro?
        </Title>
        <Text fz={{ base: "md", sm: "xl" }} lh={1.65} c="dimmed">
          AutoCrop Pro automatically detects and removes black borders, letterboxes, and pillarboxes from images and
          videos. Crop a handful of files{" "}
          <Anchor href="/cropper/" inherit fw={600}>
            in your browser
          </Anchor>{" "}
          (nothing is uploaded to our servers), or use the free Windows app for 500+ file batches with a Rust parallel
          backend and FFmpeg <Code>cropdetect</Code>.
        </Text>
        <Group gap="md" mt="lg" c="dimmed" fz="sm">
          <Group gap={6} wrap="nowrap">
            <ClockIcon size={16} />
            <span>Last updated: {LAST_UPDATED}</span>
          </Group>
          <span aria-hidden="true">·</span>
          <span>MIT License</span>
          <span aria-hidden="true">·</span>
          <Anchor href={GITHUB_URL} inherit>
            <Group gap={6} wrap="nowrap">
              <GithubLogoIcon size={16} />
              Source on GitHub
            </Group>
          </Anchor>
        </Group>
      </div>
    </Section>
  );
}
