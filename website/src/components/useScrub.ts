import { useEffect, useRef } from "react";

/** How quickly the animation catches up with the scrollbar, per frame. Lower is floatier. */
const CATCH_UP = 0.14;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Ties an element's animation to the scrollbar by writing its progress to the
 * `--p` CSS variable (0 to 1). All the choreography then lives in CSS.
 *
 * "pin":  the element is a tall track with a sticky first child. `--p` runs from
 *         the track reaching the top of the viewport to the sticky child letting go.
 * "view": `--p` runs from the element entering the viewport to its top reaching the middle.
 *
 * Does nothing unless index.html set `data-motion="on"`, so reduced-motion and
 * no-JS visitors get the static layout.
 */
export function useScrub<T extends HTMLElement>(mode: "pin" | "view" = "pin") {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.documentElement.dataset.motion !== "on") return;

    let target = 0;
    let current = -1;
    let frame = 0;

    const measure = () => {
      const { top, height } = el.getBoundingClientRect();
      if (mode === "view") {
        const viewport = window.innerHeight;
        target = clamp01((viewport - top) / (viewport * 0.5));
        return;
      }
      const sticky = el.firstElementChild as HTMLElement | null;
      const range = height - (sticky?.offsetHeight ?? window.innerHeight);
      target = range > 0 ? clamp01(-top / range) : 0;
    };

    const tick = () => {
      frame = 0;
      current += (target - current) * CATCH_UP;
      if (Math.abs(target - current) < 0.0005) current = target;
      el.style.setProperty("--p", current.toFixed(4));
      if (current !== target) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      measure();
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // Start in the right place when the page loads part-way down, e.g. from a #link.
    measure();
    current = target;
    el.style.setProperty("--p", current.toFixed(4));

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mode]);

  return ref;
}
