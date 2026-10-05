import { Button, Group, Text, Title } from "@mantine/core";
import { ArrowUpRightIcon, DownloadSimpleIcon } from "@phosphor-icons/react";

import { RELEASES_URL } from "../content/site";
import { Section } from "../components/Section";
import classes from "./Cta.module.css";

export default function Cta() {
  return (
    <Section id="download" labelledBy="cta-title" size={1000}>
      <div className={classes.panel} data-reveal>
        <Title order={2} id="cta-title" className={classes.title}>
          Your folder of letterboxed clips
          <br />
          shouldn&apos;t own your afternoon
        </Title>
        <Text className={classes.lead}>
          Crop a few files in your browser, or download AutoCrop Pro for Windows. Drop your files. Get back to actual
          creative work.
        </Text>
        <Group justify="center" gap="sm" mt="xl">
          <Button
            component="a"
            href="/cropper/"
            size="lg"
            color="white"
            c="brand.8"
            rightSection={<ArrowUpRightIcon size={18} weight="bold" />}
          >
            Crop in your browser
          </Button>
          <Button
            component="a"
            href={RELEASES_URL}
            size="lg"
            variant="outline"
            color="white"
            className={classes.ghost}
            leftSection={<DownloadSimpleIcon size={18} weight="bold" />}
          >
            Download the Windows app
          </Button>
        </Group>
        <Text className={classes.note}>
          No account. No subscription. MIT license. · Browser cropper on any OS · Native app for Windows 10/11
        </Text>
      </div>
    </Section>
  );
}
