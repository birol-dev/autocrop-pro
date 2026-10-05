import { Badge, Table } from "@mantine/core";

import { Section, SectionHeader } from "../components/Section";
import classes from "./Comparison.module.css";

type Row = { method: string; speed: string; privacy: string; preview: string; cost: string; ours?: boolean };

const ROWS: Row[] = [
  {
    method: "AutoCrop Pro (Windows)",
    speed: "500+ files, parallel Rust",
    privacy: "100% offline on your PC",
    preview: "Yes — tolerance slider",
    cost: "Free (MIT)",
    ours: true,
  },
  {
    method: "AutoCrop Pro (Web)",
    speed: "A handful of files, in-tab",
    privacy: "No upload — stays in the browser",
    preview: "Yes — real crop overlay",
    cost: "Free (MIT)",
    ours: true,
  },
  { method: "Premiere / Photoshop", speed: "~3 min per file", privacy: "Local", preview: "Yes", cost: "Subscription" },
  { method: "Cloud crop tools", speed: "Upload-limited", privacy: "Cloud upload required", preview: "Varies", cost: "Freemium" },
  {
    method: "FFmpeg cropdetect scripts",
    speed: "Fast if scripted",
    privacy: "Local",
    preview: "No — CLI only",
    cost: "Free",
  },
];

export default function Comparison() {
  return (
    <Section id="compare-tools" tint labelledBy="compare-tools-title" size={1100}>
      <SectionHeader
        eyebrow="Compare options"
        titleId="compare-tools-title"
        title="AutoCrop Pro vs manual editing, cloud tools, and FFmpeg"
        lead="Choosing how to strip letterboxes from a large media folder comes down to speed, privacy, and control."
      />

      <div className={classes.wrap} data-reveal>
        <Table.ScrollContainer minWidth={760} type="native">
          <Table verticalSpacing="md" horizontalSpacing="lg" className={classes.table}>
            <Table.Caption className={classes.caption}>
              Comparison of batch crop methods for removing black borders from images and videos
            </Table.Caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th scope="col">Method</Table.Th>
                <Table.Th scope="col">Batch speed</Table.Th>
                <Table.Th scope="col">Privacy</Table.Th>
                <Table.Th scope="col">Live preview</Table.Th>
                <Table.Th scope="col">Cost</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ROWS.map((r) => (
                <Table.Tr key={r.method} data-ours={r.ours || undefined}>
                  <Table.Th scope="row" className={classes.method}>
                    {r.method}
                    {r.ours && (
                      <Badge size="xs" variant="filled" ml={8} className={classes.badge}>
                        Ours
                      </Badge>
                    )}
                  </Table.Th>
                  <Table.Td>{r.speed}</Table.Td>
                  <Table.Td>{r.privacy}</Table.Td>
                  <Table.Td>{r.preview}</Table.Td>
                  <Table.Td>{r.cost}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </div>
    </Section>
  );
}
