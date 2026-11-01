# AutoCrop Pro website design system

A monochrome gallery frame that stays quiet so the media supplies 100% of the colour.
AutoCrop Pro is a tool that removes black bars, so the black letterbox bar is the site's
one recurring idea: the hero and the closing section are literally letterboxed frames.

Tokens live in `src/global.css`, the Mantine theme in `src/theme.ts`, and the shared
building blocks in `src/components/Section.tsx`. Use them. Do not invent new colours,
radii or spacing values.

## Colour

- No hue anywhere in the frame. No violet, gradient text, coloured icons or coloured badges.
- Style with the tone variables only: `--surface`, `--panel`, `--ink`, `--muted`, `--fade`,
  `--hairline`. They flip with `data-tone` and with dark mode, so never hardcode a hex for
  text or backgrounds. Do not use `--mantine-color-brand-*`.
- Sections swap background as chapter breaks through `<Chapter tone="paper|white|charcoal|black">`.
- The cropper tool may use red for real errors. Nothing else gets a semantic colour.

## Type

- Size over weight. Thin giant serif (Newsreader, weight 200) plus one small sans (Inter, 400).
- Headings use Mantine `Title`, which is already serif and thin. Never bold a heading.
- Emphasis inside a headline is `<Fade>`: one phrase per headline fades to grey. Nothing
  else is used for emphasis: no bold, colour, or underline. On light backgrounds the fade is
  `#8A8A8A`, not `#B6B6B6`, so large text keeps 3:1 contrast.
- Body text is 15 to 18px in `--muted`, line-height about 1.55, max 60ch.
- Small labels are 13px sentence case. No uppercase eyebrows, no letter-spaced labels, no
  coloured badges above headings.
- Dense tool UI (the cropper) may use weight 500 for titles and grey for metadata.

## Layout

- Skeleton: 4 columns inside `--page-margin` (65px desktop, 20px mobile). Sections use
  whatever column count they need: 2, 3 or 4, or none.
- `<Cells cols colsMobile>` and `<Cell tall>` draw the 1px hairline grid. A tall cell pins its
  content to the bottom of an empty 540px cell (shrinks on mobile).
- `<Chapter index="01" label="...">` opens with a numbered full-width index line.
- Spacing: tiny inside a unit (4 to 8px), medium between text and its visual
  (`--space-group`, `--space-block`), huge between topics (`--space-item`, `--space-chapter`).
- Space is the first divider, then background tint, then a hairline. No card borders.
- A few visuals break the page edge on purpose. Everything else stays aligned.

## Surfaces

- Pills (`<Pill>`) for every control. Panels and big cards use `--radius-panel` (32px) or
  `--radius-card` (24px). Small inner pieces use `--radius-inner` (10px).
- No borders and no drop shadows on cards. `--shadow-float` is only for things that float:
  the menu, mock windows and tilted frames.
- A mock window may sit inside a tinted panel. Never nest anything deeper than that.

## Media

- `<MediaFrame>` with entries from `src/content/media.ts`. Never hardcode a media path.
- No text ever sits on a picture. Captions go underneath. Only non-text overlays such as
  crop brackets may sit on top of a picture.
- Floating frames tilt 5 to 10 degrees and run partly off screen.
- Mock windows show that the product works: pictures say what it is for.

## Motion

- Quiet and purposeful, 180 to 600ms with `--ease-out`. Honour `prefers-reduced-motion`.
- `data-reveal` gives the scroll-driven fade-up. Apply it to blocks, not to every element.

## Empty states (cropper)

Top to bottom, with the page structure left in place: a grey picture about 120px wide that
previews the content, 16px gap, a specific 16px title, one line on why and what next in 14px
grey, 20px gap, a primary pill and a secondary link.

## Must not break

- Prerendering: components render on the server, so do not touch `window`, `document` or
  `localStorage` during render. Client-only work goes in `useEffect`.
- Section ids used by navigation and the footer: `features`, `how-it-works`, `simulator`,
  `compare-tools`, `faq`, `download`.
- The `h1` is unique to the page. Sections keep their `aria-labelledby` heading ids.
- Interactive demos stay keyboard accessible. Tap targets are at least 44px.
- No horizontal page scroll at any width. Check 375px.
