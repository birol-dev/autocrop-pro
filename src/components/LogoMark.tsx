import { useEffect, useId, useRef } from "react";

import classes from "./LogoMark.module.css";

const CLOSED = 124;
const INK = "#1e1e1e";

const blink = (direction: 1 | -1) => [
    { transform: "translateY(0)" },
    { transform: `translateY(${direction * CLOSED}px)`, offset: 0.42 },
    { transform: "translateY(0)" },
];

type LogoMarkProps = { size: number; className?: string };

/**
 * The logo, drawn live so its bars can move: they slide apart when the page opens, and close and
 * reopen once when the pointer enters the logo's parent. `src-tauri/icons/logo.svg` is the still.
 */
export default function LogoMark({ size, className }: LogoMarkProps) {
    const id = useId().replace(/\W/g, "");
    const svg = useRef<SVGSVGElement>(null);
    const top = useRef<SVGRectElement>(null);
    const bottom = useRef<SVGRectElement>(null);

    useEffect(() => {
        const host = svg.current?.parentElement;
        if (!host) return;

        let running = false;
        const play = () => {
            if (running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            const timing = { duration: 620, easing: "cubic-bezier(0.65, 0, 0.35, 1)" };
            const animation = top.current?.animate(blink(1), timing);
            bottom.current?.animate(blink(-1), timing);
            if (!animation) return;
            running = true;
            animation.onfinish = () => {
                running = false;
            };
        };

        host.addEventListener("pointerenter", play);
        return () => host.removeEventListener("pointerenter", play);
    }, []);

    return (
        <svg
            ref={svg}
            className={className}
            viewBox="0 0 512 512"
            width={size}
            height={size}
            aria-hidden="true"
            data-testid="logo-mark"
        >
            <defs>
                <clipPath id={`${id}tile`}>
                    <rect width="512" height="512" rx="116" />
                </clipPath>
                <linearGradient id={`${id}sky`} gradientUnits="userSpaceOnUse" x1="0" y1="136" x2="0" y2="376">
                    <stop offset="0" stopColor="#4fa9e3" />
                    <stop offset="1" stopColor="#c9e8fa" />
                </linearGradient>
            </defs>
            <g clipPath={`url(#${id}tile)`}>
                <rect width="512" height="512" fill={INK} />
                <path
                    className={classes.picture}
                    fill={`url(#${id}sky)`}
                    d="M0 136H226L92 376H0Z M286 136H512V376H420Z M226 229 260 290H192Z M172 326H280L308 376H144Z"
                />
                {/* Taller than they look, past the clip, so closed they overlap and no sky shows at the seams. */}
                <rect ref={top} className={classes.top} y="-124" width="512" height="260" fill={INK} />
                <rect ref={bottom} className={classes.bottom} y="376" width="512" height="260" fill={INK} />
            </g>
            <rect
                x="2.5"
                y="2.5"
                width="507"
                height="507"
                rx="113.5"
                fill="none"
                stroke="#fff"
                strokeOpacity=".12"
                strokeWidth="5"
            />
        </svg>
    );
}
