import LogoMark from "@app/components/LogoMark";

import classes from "./Logo.module.css";

type LogoProps = { size?: number; href?: string };

export default function Logo({ size = 36, href = "/" }: LogoProps) {
  return (
    <a href={href} className={classes.root} aria-label="AutoCrop Pro home">
      <LogoMark size={size} className={classes.mark} />
      <span className={classes.word} style={{ fontSize: size >= 36 ? 20 : 18 }}>
        AutoCrop <span className={classes.pro}>Pro</span>
      </span>
    </a>
  );
}
