import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import classes from "./Section.module.css";

export type Tone = "white" | "paper" | "charcoal" | "black";

type ChapterProps = {
  id?: string;
  /** Background swap that marks the chapter break. */
  tone?: Tone;
  /** Renders the numbered full-width index line, e.g. "01". */
  index?: string;
  /** Short label on the index line. */
  label?: string;
  /** Accessible name for the section landmark (id of its heading). */
  labelledBy?: string;
  /** Drop the page margins so the content can run edge to edge. */
  bleed?: boolean;
  /** Remove the chapter's top padding when it continues the previous one. */
  flushTop?: boolean;
  className?: string;
  children: ReactNode;
};

/** A page section: its own tone, the page margins and the chapter rhythm. */
export function Chapter({ id, tone = "white", index, label, labelledBy, bleed, flushTop, className, children }: ChapterProps) {
  const dark = tone === "charcoal" || tone === "black";
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-tone={tone}
      data-mantine-color-scheme={dark ? "dark" : undefined}
      data-flush-top={flushTop || undefined}
      className={[classes.chapter, className].filter(Boolean).join(" ")}
    >
      {index && (
        <div className={classes.margins}>
          <IndexLine index={index} label={label} />
        </div>
      )}
      {bleed ? children : <div className={classes.margins}>{children}</div>}
    </section>
  );
}

/** `01 ─────── Label`, the numbered line that opens a chapter. */
export function IndexLine({ index, label }: { index: string; label?: string }) {
  return (
    <div className={classes.indexLine}>
      <span>{index}</span>
      <span className={classes.rule} aria-hidden="true" />
      {label && <span>{label}</span>}
    </div>
  );
}

/** Page margins for anything that lives outside a Chapter. */
export function Margins({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={[classes.margins, className].filter(Boolean).join(" ")}>{children}</div>;
}

/** The secondary words of a headline, faded instead of bolded. */
export function Fade({ children }: { children: ReactNode }) {
  return <span className={classes.fade}>{children}</span>;
}

/** Hairline grid: columns snap to the skeleton and 1px rules separate the cells. */
export function Cells({
  cols = 4,
  colsMobile = 1,
  className,
  children,
}: {
  cols?: number;
  colsMobile?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={[classes.cells, className].filter(Boolean).join(" ")}
      style={{ "--cols": cols, "--cols-mobile": colsMobile } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** One cell of a `Cells` grid. `tall` pins the content to the bottom of an empty cell. */
export function Cell({ tall, className, children }: { tall?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={[classes.cell, className].filter(Boolean).join(" ")} data-tall={tall || undefined}>
      {children}
    </div>
  );
}

type PillVariant = "solid" | "soft" | "plain";

type PillBase = { variant?: PillVariant; size?: "md" | "lg"; icon?: ReactNode; iconRight?: ReactNode; children: ReactNode };
type PillAnchor = PillBase & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type PillButton = PillBase & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

/** The site's button. Every call to action is a pill, and it reads the local tone. */
export function Pill({ variant = "solid", size = "md", icon, iconRight, className, children, ...rest }: PillAnchor | PillButton) {
  const shared = {
    className: [classes.pill, className].filter(Boolean).join(" "),
    "data-variant": variant,
    "data-size": size,
  };
  const content = (
    <>
      {icon}
      <span>{children}</span>
      {iconRight}
    </>
  );
  if (typeof rest.href === "string") {
    return (
      <a {...shared} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" {...shared} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}

type MediaFrameProps = {
  src: string;
  alt: string;
  /** CSS aspect-ratio, e.g. "4 / 3". */
  ratio?: string;
  /** Rotation in degrees for floating frames (5–10). Adds the floating shadow. */
  tilt?: number;
  /** Load straight away. Use for the first screen only. */
  eager?: boolean;
  className?: string;
  /** Overlays such as crop brackets. Never put text on a picture. */
  children?: ReactNode;
};

/** A rounded picture. No border and no shadow unless it floats. */
export function MediaFrame({ src, alt, ratio = "16 / 9", tilt, eager, className, children }: MediaFrameProps) {
  const style: CSSProperties = { aspectRatio: ratio };
  if (tilt) style.rotate = `${tilt}deg`;
  return (
    <figure
      className={[classes.media, className].filter(Boolean).join(" ")}
      style={style}
      data-floating={tilt ? true : undefined}
    >
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
      {children}
    </figure>
  );
}
