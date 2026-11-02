import { Accordion, Title } from "@mantine/core";
import { PlusIcon } from "@phosphor-icons/react";

import { FAQS } from "../content/faq";
import { Chapter, Fade } from "../components/Section";
import classes from "./Faq.module.css";

export default function Faq() {
  return (
    <Chapter tone="white" id="faq" labelledBy="faq-title">
      <div className={classes.wrap}>
        <Title order={2} id="faq-title" className={classes.title}>
          Fair <Fade>questions</Fade>
        </Title>

        <div className={classes.list} data-reveal>
          <Accordion
            variant="default"
            chevron={<PlusIcon size={22} weight="light" />}
            chevronSize={28}
            classNames={{
              item: classes.item,
              control: classes.control,
              label: classes.label,
              chevron: classes.chevron,
              content: classes.content,
            }}
          >
            {FAQS.map((faq, i) => (
              <Accordion.Item key={faq.q} value={`faq-${i}`}>
                <Accordion.Control>
                  <h3 className={classes.q}>{faq.q}</h3>
                </Accordion.Control>
                <Accordion.Panel>{faq.a}</Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </Chapter>
  );
}
