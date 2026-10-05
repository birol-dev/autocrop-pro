import { Accordion } from "@mantine/core";
import { PlusIcon } from "@phosphor-icons/react";

import { FAQS } from "../content/faq";
import { Section, SectionHeader } from "../components/Section";
import classes from "./Faq.module.css";

export default function Faq() {
  return (
    <Section id="faq" labelledBy="faq-title" size={860}>
      <SectionHeader eyebrow="FAQ" titleId="faq-title" title="Common questions" />

      <div data-reveal>
        <Accordion
          variant="separated"
          radius="lg"
          defaultValue="faq-0"
          chevron={<PlusIcon size={18} weight="bold" />}
          classNames={{ item: classes.item, control: classes.control, chevron: classes.chevron, content: classes.content }}
        >
          {FAQS.map((f, i) => (
            <Accordion.Item key={f.q} value={`faq-${i}`}>
              <Accordion.Control>
                <h3 className={classes.q}>{f.q}</h3>
              </Accordion.Control>
              <Accordion.Panel>{f.a}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
