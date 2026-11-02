import { Title } from "@mantine/core";

import Scene from "../components/Scene";
import { useScrub } from "../components/useScrub";
import { MEDIA } from "../content/media";
import { STEPS } from "../content/steps";
import classes from "./Steps.module.css";

/** One pinned frame acts out the workflow: files land, the bars are found, the bars are cut. */
export default function Steps() {
  const track = useScrub<HTMLElement>();

  return (
    <section ref={track} id="how-it-works" data-tone="paper" className={classes.track} aria-labelledby="how-title">
      <div className={classes.stage}>
        <h2 id="how-title" className={classes.srOnly}>
          How it works
        </h2>

        <ol className={classes.captions}>
          {STEPS.map((step, i) => (
            <li key={step.name} className={classes.caption} data-step={i + 1}>
              <span className={classes.count}>{i + 1} of {STEPS.length}</span>
              <Title order={3} className={classes.name}>
                {step.name}
              </Title>
              <p className={classes.body}>{step.body}</p>
            </li>
          ))}
        </ol>

        <div className={classes.scene} aria-hidden="true">
          <img className={`${classes.file} ${classes.fileA}`} src={MEDIA.harbor.src} alt="" loading="lazy" decoding="async" />
          <img className={`${classes.file} ${classes.fileB}`} src={MEDIA.rooftops.src} alt="" loading="lazy" decoding="async" />
          <div className={classes.frame}>
            <div className={classes.cut}>
              <Scene mode="full" />
            </div>
            <span className={`${classes.mark} ${classes.markTL}`} />
            <span className={`${classes.mark} ${classes.markTR}`} />
            <span className={`${classes.mark} ${classes.markBL}`} />
            <span className={`${classes.mark} ${classes.markBR}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
