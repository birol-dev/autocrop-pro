import { useId } from "react";

type SceneProps = {
  /**
   * "full"    – the 16:9 frame with its 130px letterbox bars (before).
   * "cropped" – only the picture area, bars removed (after).
   */
  mode?: "full" | "cropped";
  className?: string;
};

/** Frame geometry shared with the simulator: 1920x1080 with 130px bars top and bottom. */
export const SCENE = { w: 1920, h: 1080, bar: 130 } as const;

/**
 * Illustrated sunset used by the before/after slider and the tolerance
 * simulator. It's an inline SVG so it stays crisp and follows no network.
 */
export default function Scene({ mode = "full", className }: SceneProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sky = `sky${uid}`;
  const glow = `glow${uid}`;
  const water = `water${uid}`;
  const { w, h, bar } = SCENE;

  const viewBox = mode === "cropped" ? `0 ${bar} ${w} ${h - bar * 2}` : `0 0 ${w} ${h}`;

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={
        mode === "cropped"
          ? "Illustrated sunset over mountains, cropped to the picture"
          : "Illustrated sunset over mountains with black letterbox bars"
      }
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#140a2e" />
          <stop offset="0.38" stopColor="#4c1d95" />
          <stop offset="0.62" stopColor="#be185d" />
          <stop offset="0.74" stopColor="#fb923c" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#fde047" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={water} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c2d6e" />
          <stop offset="1" stopColor="#1a0b33" />
        </linearGradient>
      </defs>

      <rect width={w} height={h} fill={`url(#${sky})`} />

      {/* stars */}
      <g fill="#fff" opacity="0.75">
        <circle cx="210" cy="250" r="3" />
        <circle cx="430" cy="190" r="2" />
        <circle cx="640" cy="310" r="2.5" />
        <circle cx="1230" cy="230" r="2" />
        <circle cx="1480" cy="300" r="3" />
        <circle cx="1700" cy="210" r="2.5" />
        <circle cx="1810" cy="360" r="2" />
        <circle cx="90" cy="420" r="2" />
      </g>

      {/* sun */}
      <circle cx="960" cy="610" r="260" fill={`url(#${glow})`} />
      <circle cx="960" cy="610" r="122" fill="#fde047" />

      {/* mountains */}
      <polygon points="0,780 360,470 760,780" fill="#3b1470" />
      <polygon points="560,780 960,430 1360,780" fill="#2e1065" />
      <polygon points="1100,780 1500,500 1920,780" fill="#3b1470" />
      <polygon points="-40,820 240,640 560,820" fill="#1e0a3c" />
      <polygon points="1240,820 1560,630 1960,820" fill="#1e0a3c" />

      {/* water */}
      <rect y="780" width={w} height={h - 780} fill={`url(#${water})`} />
      <rect x="840" y="800" width="240" height="8" rx="4" fill="#fde047" opacity="0.5" />
      <rect x="890" y="830" width="140" height="6" rx="3" fill="#fde047" opacity="0.35" />
      <rect x="920" y="858" width="80" height="5" rx="2.5" fill="#fde047" opacity="0.25" />

      {/* letterbox bars */}
      {mode === "full" && (
        <>
          <rect width={w} height={bar} fill="#000" />
          <rect y={h - bar} width={w} height={bar} fill="#000" />
        </>
      )}
    </svg>
  );
}
