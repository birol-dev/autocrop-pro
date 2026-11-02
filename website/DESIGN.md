# AutoCrop Pro website design system

A monochrome gallery frame that stays quiet so the media supplies 100% of the colour.
AutoCrop Pro is a tool that removes black bars, so the black letterbox bar is the site's
one recurring idea: the hero's glass app window plays a letterboxed clip whose bars scroll away.

Tokens live in `src/global.css`, the Mantine theme in `src/theme.ts`, and the shared
building blocks in `src/components/Section.tsx` and `src/components/useScrub.ts`. Use them. Do not invent new colours,
radii or spacing values.

## Colour

- No hue anywhere in the frame. No violet, gradient text, coloured icons or coloured badges.
- Style with the tone variables only: `--surface`, `--panel`, `--ink`, `--muted`, `--fade`,
  `--hairline`. They flip with `data-tone` and with dark mode, so never hardcode a hex for
  text or backgrounds. Do not use `--mantine-color-brand-*`.
- Sections swap background as chapter breaks through `<Chapter tone="paper|white|charcoal|black">`.
- The cropper tool may use red for real errors. Nothing else gets a semantic colour.
- The hero and the cropper page are the exceptions to the tone variables: they sit on a photograph,
  so their words, glass window and veil are styled directly in white and the photo's sky blue.
- The base tones, radii, shadow and easing live in `src/tokens.css`, shared with the desktop app.

## Logo

- A thick-and-thin A, like Newsreader's, carved out of a letterboxed picture: the two black bars
  are its serifs, and the sky behind it is the only colour. It is a small picture, which is why it
  may have a hue when the frame may not. Do not recolour it or draw it without the bars.
- `src-tauri/icons/logo.svg` is the source. Every icon and `public/` PNG is generated from it with
  `tauri icon`; the social image `logo-app.png` is the same drawing, square and opaque.
- `LogoMark` draws it live in the site's and app's headers. The bars are the only moving idea: they
  slide apart when the page opens, and close and reopen once on hover. Nothing else animates, it
  never loops, and it holds still under reduced motion.

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

- Everything sits on the page's centre line: headings, copy, actions, the footer. Multi-line
  answers (the FAQ) stay left-aligned inside a centered column, because centered paragraphs
  are hard to read.
- Page margin is `--page-margin` (65px desktop, 20px mobile).
- Spacing: tiny inside a unit (4 to 8px), medium between text and its visual
  (`--space-group`, `--space-block`), huge between topics (`--space-item`, `--space-chapter`).
- Space is the first divider, then background tint, then a hairline. No card borders.

## Copy

- Say less. One idea per section, one short sentence under a heading, and no spec lists on the
  page. Technical detail belongs in the FAQ and `public/llms.txt`.
- Plain words over engineering words: "bars", not "letterbox boundaries"; "slider", not
  "tolerance sweep". No claim the product can't back up, and no invented numbers.

## Surfaces

- Pills (`<Pill>`) for every control. Panels and big cards use `--radius-panel` (32px) or
  `--radius-card` (24px). Small inner pieces use `--radius-inner` (10px).
- No borders and no drop shadows on cards. `--shadow-float` is only for things that float:
  the menu, mock windows and tilted frames.
- A mock window may sit inside a tinted panel. Never nest anything deeper than that.

## Media

- `<MediaFrame>` with entries from `src/content/media.ts`. Never hardcode a media path.
- No text sits on a picture, with one exception: the hero's words sit on the empty sky of its
  landscape, under a veil that keeps white text readable. Everywhere else captions go
  underneath, and only non-text overlays such as crop brackets may sit on top of a picture.
- Floating frames tilt 5 to 10 degrees and run partly off screen.
- Mock windows show that the product works: pictures say what it is for.

## Motion

- The page is scroll-scrubbed: the big scenes play forwards and backwards with the scrollbar.
  `useScrub` writes progress to the `--p` CSS variable (0 to 1) and all choreography lives in CSS,
  using only `transform`, `opacity` and `clip-path`.
- A pinned scene is a tall track with a sticky first child. Gate its track height and sticky
  behaviour behind `:root[data-motion='on']`, which `index.html` sets before first paint. Without
  it (reduced motion, no JS) the same markup must read as a normal static section.
- Everything else is quiet and purposeful, 180 to 600ms with `--ease-out`.
- `data-reveal` gives the scroll-driven fade-up. Apply it to blocks, not to every element.

## The tool (cropper and desktop app)

Both run the same interface, from `src/components/workbench`: a bar with pill tabs, the queue as
rows on the left, the picture with its crop marks on the right, then the one slider, the few
options and the action. It is what the landing's `AppWindow` promises, so keep them alike. The
parts read only the tone variables, which is how one set works on the desktop app's plain surface
and on the cropper's dark glass.

Empty states say what to do in a thin serif line with a faded second phrase, then pills. No
pictures, no paragraphs.

## Must not break

- Prerendering: components render on the server, so do not touch `window`, `document` or
  `localStorage` during render. Client-only work goes in `useEffect`.
- Section ids used by navigation and the footer: `how-it-works`, `simulator`, `faq`, `download`.
- The `h1` is unique to the page. Sections keep their `aria-labelledby` heading ids.
- Interactive demos stay keyboard accessible. Tap targets are at least 44px.
- No horizontal page scroll at any width. Check 375px.
