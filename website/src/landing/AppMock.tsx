import { Badge, Button, Card, Group, Paper, SegmentedControl, Select, SimpleGrid, Slider, Stack, Switch, Text } from "@mantine/core";
import { CheckCircleIcon, FolderOpenIcon, GearSixIcon, LightningIcon, StackIcon } from "@phosphor-icons/react";
import MediaThumb from "@app/components/MediaThumb";

import classes from "./AppMock.module.css";

const ITEMS = [
  { name: "sunset-beach.png", src: "/samples/sunset-beach.svg", detect: true },
  { name: "mountain-lake.jpg", src: "/samples/mountain-lake.svg" },
  { name: "city-night.png", src: "/samples/city-night.svg" },
  { name: "pine-forest.webp", src: "/samples/pine-forest.svg" },
];

const NAV = [
  {
    value: "queue",
    label: (
      <Group gap={6} wrap="nowrap">
        <StackIcon size={14} />
        <span>Queue</span>
        <Badge size="xs" circle>
          4
        </Badge>
      </Group>
    ),
  },
  {
    value: "outputs",
    label: (
      <Group gap={6} wrap="nowrap">
        <FolderOpenIcon size={14} />
        <span>Outputs</span>
      </Group>
    ),
  },
  {
    value: "settings",
    label: (
      <Group gap={6} wrap="nowrap">
        <GearSixIcon size={14} />
        <span>Settings</span>
      </Group>
    ),
  },
];

/**
 * A static, non-interactive replica of the desktop app's queue screen, built
 * from the same Mantine components + theme so it always matches the real UI.
 */
export default function AppMock() {
  return (
    <div className={classes.tilt}>
      <Paper className={classes.window} withBorder shadow="lg" aria-hidden="true" inert>
        <div className={classes.chrome}>
          <span className={classes.dots}>
            <i />
            <i />
            <i />
          </span>
          <Text size="xs" c="dimmed" fw={500}>
            AutoCrop Pro
          </Text>
        </div>

        <div className={classes.header}>
          <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
            <img src="/logo-icon.png" width={22} height={22} alt="" className={classes.logo} />
            <Text fw={700} fz="sm" style={{ whiteSpace: "nowrap" }}>
              AutoCrop Pro
            </Text>
          </Group>
          <div className={classes.nav}>
            <SegmentedControl size="xs" value="queue" data={NAV} readOnly />
          </div>
        </div>

        <div className={classes.body}>
          <div className={classes.main}>
            <Group justify="space-between" mb="xs" wrap="nowrap">
              <Group gap={8} wrap="nowrap">
                <Text fw={700}>Queue</Text>
                <Badge size="sm" variant="light">
                  4
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                4 images ready to process
              </Text>
            </Group>

            <SimpleGrid cols={2} spacing="xs">
              {ITEMS.map((item) => (
                <Card key={item.name} withBorder padding={0} radius="md">
                  <MediaThumb src={item.src} type="image" name={item.name}>
                    {item.detect && <div className={classes.crop} />}
                    <Badge
                      className={classes.ready}
                      size="xs"
                      color="teal"
                      variant="filled"
                      leftSection={<CheckCircleIcon size={10} weight="fill" />}
                    >
                      Crop ready
                    </Badge>
                  </MediaThumb>
                  <Text size="xs" fw={600} px={8} py={6} truncate>
                    {item.name}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </div>

          <div className={classes.aside}>
            <Stack gap="xs">
              <Text fw={700} fz="sm">
                Export settings
              </Text>
              <Paper withBorder p="xs">
                <Group justify="space-between" mb={6}>
                  <Text size="xs" fw={600}>
                    Detection tolerance
                  </Text>
                  <Badge size="xs" variant="light">
                    20%
                  </Badge>
                </Group>
                <Slider value={20} label={null} size="xs" thumbSize={12} tabIndex={-1} aria-hidden="true" />
              </Paper>
              <Select size="xs" label="Output format" data={["Same as source"]} value="Same as source" readOnly />
              <Paper withBorder p="xs">
                <Switch size="xs" label="Padding" labelPosition="left" checked readOnly styles={{ body: { justifyContent: "space-between", width: "100%" } }} />
              </Paper>
            </Stack>
            <Button fullWidth size="xs" leftSection={<LightningIcon size={14} weight="fill" />} mt="sm">
              Process files
            </Button>
          </div>
        </div>
      </Paper>
    </div>
  );
}
