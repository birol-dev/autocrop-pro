import { Title } from "@mantine/core";

import { useScrub } from "../components/useScrub";
import classes from "./Statement.module.css";

const WORDS = "Cropping one clip takes seconds. Two hundred takes your afternoon.".split(" ");

/** One sentence, pinned to the screen, that lights up word by word as you scroll. */
export default function Statement() {
  const track = useScrub<HTMLElement>();

  return (
    <section
      ref={track}
      data-tone="black"
      data-mantine-color-scheme="dark"
      className={classes.track}
      style={{ ["--count" as string]: WORDS.length }}
      aria-labelledby="statement-title"
    >
      <div className={classes.stage}>
        <Title order={2} id="statement-title" className={classes.text}>
          {WORDS.map((word, i) => (
            <span key={i} className={classes.word} style={{ ["--i" as string]: i }}>
              {word}{" "}
            </span>
          ))}
        </Title>
      </div>
    </section>
  );
}
