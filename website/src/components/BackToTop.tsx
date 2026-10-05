import { ActionIcon, Affix, Transition } from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import { ArrowUpIcon } from "@phosphor-icons/react";

export default function BackToTop() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <Affix position={{ bottom: 20, right: 20 }}>
      <Transition transition="slide-up" mounted={scroll.y > 900}>
        {(styles) => (
          <ActionIcon
            style={{ ...styles, boxShadow: "var(--mantine-shadow-md)" }}
            size={44}
            radius="xl"
            variant="filled"
            aria-label="Back to top"
            onClick={() => scrollTo({ y: 0 })}
          >
            <ArrowUpIcon size={20} weight="bold" />
          </ActionIcon>
        )}
      </Transition>
    </Affix>
  );
}
