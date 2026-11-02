import { MEDIA } from "../content/media";

type SceneProps = {
  /**
   * "full"    – the 16:9 frame with its 140px letterbox bars (before).
   * "cropped" – only the picture area, bars removed (after).
   */
  mode?: "full" | "cropped";
  className?: string;
};

/** Frame geometry shared with the simulator: a 1920x800 picture in a 1920x1080 frame. */
export const SCENE = { w: 1920, h: 1080, bar: 140 } as const;

/** The 1920x800 coast still, optionally inside its letterbox, used by the crop demos. */
export default function Scene({ mode = "full", className }: SceneProps) {
  const { w, h, bar } = SCENE;
  const viewBox = mode === "cropped" ? `0 ${bar} ${w} ${h - bar * 2}` : `0 0 ${w} ${h}`;

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={mode === "cropped" ? `${MEDIA.coast.alt}, cropped to the picture` : `${MEDIA.coast.alt}, with black letterbox bars`}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <rect width={w} height={h} fill="#000" />
      <image href={MEDIA.coast.src} x="0" y={bar} width={w} height={h - bar * 2} preserveAspectRatio="xMidYMid slice" />
    </svg>
  );
}
