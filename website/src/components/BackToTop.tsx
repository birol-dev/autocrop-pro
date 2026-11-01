import { Affix, Transition } from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import { ArrowUpIcon } from "@phosphor-icons/react";

import classes from "./BackToTop.module.css";

export default function BackToTop() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <Affix position={{ bottom: 20, right: 20 }}>
      <Transition transition="slide-up" mounted={scroll.y > 900}>
        {(styles) => (
          <button
            type="button"
            style={styles}
            className={classes.button}
            aria-label="Back to top"
            onClick={() => scrollTo({ y: 0 })}
          >
            <ArrowUpIcon size={20} weight="bold" />
          </button>
        )}
      </Transition>
    </Affix>
  );
}
