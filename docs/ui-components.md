# AutoCrop Pro — UI component inventory

Everything the desktop app renders, what it was built from before the redesign,
and what it is built from now. Source lives in `src/`.

**Stack after the redesign:** React 19 · [Mantine 9](https://mantine.dev) (components, theming, notifications) ·
[Phosphor Icons](https://phosphoricons.com) (`@phosphor-icons/react`) · Inter (bundled via Fontsource, works offline) ·
CSS Modules + `postcss-preset-mantine` for the few bespoke styles.
Tailwind, `lucide-react`, `sonner`, `clsx`, `tailwind-merge` were removed.

## 1. Screens / containers

| Component | File | Before | After (Mantine) |
|---|---|---|---|
| App shell (header + main + right panel) | `App.tsx` | hand-rolled flex + inline styles | `AppShell` (`header`, `aside`, `main`) |
| Queue screen | `App.tsx` + `FileQueue.tsx` | dropzone `div` + card grid | `Dropzone`, `FileQueue` |
| Outputs screen | `OutputsPanel.tsx` | toolbar + grid + custom lightbox | `OutputsPanel` with `Modal` lightbox |
| Settings screen | `SettingsPanel.tsx` | two inline-styled cards | `SettingsPanel` (`Paper` sections) |
| Export settings side panel | `SettingsSidebar.tsx` | `aside` with native inputs | `SettingsSidebar` inside `AppShell.Aside` |
| Preview + crop overlay dialog | `PreviewModal.tsx` | custom fixed overlay | Mantine `Modal` |

## 2. Primitive UI pieces (before → after)

| Piece | Where used | Before | After | Icon (Phosphor) |
|---|---|---|---|---|
| Logo + title | header | `img` + `h1` | `Image` + `Title` | – |
| Tab bar (Queue / Outputs / Settings) | header | custom buttons | `SegmentedControl` | `Stack`, `FolderOpen`, `GearSix` |
| Count badge | tab, queue, outputs, process button | styled `span` | `Badge` | – |
| Theme toggle | header | custom button | `ActionIcon` + `Tooltip` | `Sun` / `Moon` |
| Global progress | header (new) | – | `Progress` | – |
| Drop zone | queue | dashed `div` | `UnstyledButton` (CSS Module), `ThemeIcon`, `Button` | `UploadSimple`, `Plus` |
| File card | queue | `div` card | `Card` (+ `Card.Section`), `AspectRatio` | – |
| Thumbnail (image / video / fallback) | queue, outputs | `img`/`video` | `Image` / `video` + `Center` fallback | `ImageSquare`, `FilmStrip` |
| Play overlay | video cards | custom `div` | `ThemeIcon` over hover overlay | `Play` |
| Remove button | file card | custom button | `ActionIcon` (red, light) | `Trash` |
| "Crop ready" tag | file card | styled `div` | `Badge` (teal) | `CheckCircle` |
| Queue toolbar (new) | queue | – | `Group`, `Button` (Clear all / Add files), summary `Text` | `Trash`, `Plus` |
| Empty state | outputs | dashed `div` | `Paper` + `ThemeIcon` + `Button` | `Images`, `ArrowRight` |
| Loading state | outputs, preview | CSS spinner | `Skeleton`, `Loader`, `LoadingOverlay` | – |
| Toolbar buttons | outputs | custom buttons | `Button` / `ActionIcon` | `FolderOpen`, `ArrowsClockwise` |
| Output card | outputs | `div` card | `Card` + hover reveal `ActionIcon` | `Clock`, `FolderOpen` |
| Lightbox | outputs | fixed overlay | `Modal` | `FolderOpen`, `X` |
| Status chip | preview header | styled `span` | `Badge` (violet / teal / gray) | `Crop` |
| Crop overlay + dimension tag | preview | absolutely positioned `div` | same geometry, restyled | – |
| Close button | modals | custom button | `Modal.CloseButton` | `X` |
| Crop stats (new) | preview footer | – | `SimpleGrid` of labelled values, `Kbd` (Esc) | `Crop` |
| Tolerance slider | sidebar | `<input type=range>` | `Slider` (with marks) + value `Badge` | – |
| Output format | sidebar | native `<select>` | `Select` | `FileImage` |
| Padding / Delete originals | sidebar | custom switch buttons | `Switch` (label + description) | `ArrowsOutSimple`, `Trash` |
| Delete warning (new) | sidebar | – | red inline description on the `Switch` | – |
| Process button + progress | sidebar | custom button w/ fill | `Button` + `Progress` + status `Text` | `Lightning`, `CaretRight` |
| Section cards / dividers | sidebar, settings | bordered `div` | `Paper` / `Divider` | – |
| Save-location field | settings | path in a `div` | `TextInput` (read-only) | `FolderSimple` |
| Browse / Reset buttons | settings | custom buttons | `Button` / `ActionIcon` + `Tooltip` | `FolderOpen`, `ArrowCounterClockwise` |
| Appearance selector (new) | settings | – | `SegmentedControl` (Light / Dark / System) | `Sun`, `Moon`, `Desktop` |
| About card | settings | `div` | `Paper` + `Badge` (version) + `Text` | `Info` |
| Toasts | everywhere | `sonner` | `@mantine/notifications` | `CheckCircle`, `WarningCircle` |

## 3. Shared building blocks (new)

| Component | File | Purpose |
|---|---|---|
| `MediaThumb` | `components/MediaThumb.tsx` | Cover-fit image/video thumbnail with play overlay and a graceful fallback; used by the queue and the outputs gallery |
| `PageHeader` | `components/PageHeader.tsx` | Title + count badge + description + right-aligned actions for every screen |
| `Dropzone` | `components/Dropzone.tsx` | Extracted from `App.tsx`; full-height when empty, slim "add more" bar once files exist |
| `notifyError` / `notifySuccess` | `lib/notify.tsx` | Thin wrappers over `@mantine/notifications` |
| `MediaGrid.module.css` | `components/` | Shared auto-fill grid + hover/focus card styles |
| `mockTauri.ts` | `dev/` | Dev-only fake backend + sample media so the UI runs in a plain browser (not in prod bundles) |

## 4. Design tokens

Defined once in `src/theme.ts` (Mantine theme) instead of ad-hoc CSS variables:
brand colour (violet, matching the logo's flower), Inter typography, radii, light/dark neutrals,
default component props (radius, size, focus ring).

## 5. Website (`website/`)

The marketing site and in-browser cropper got the same treatment and now share the app's theme
(`src/theme.ts`) and `MediaThumb`. It is a separate Vite project (React 19 + Mantine 9 + Phosphor), prerendered to
static HTML at build time so SEO, JSON-LD and `sitemap.xml` stay intact.

### Shared chrome (`website/src/components/`)

| Component | Built from | Notes |
|---|---|---|
| `SiteHeader` | `Burger` + `Drawer` (mobile), `Button`, `ActionIcon` + `Tooltip` | Sticky, blurred; `current="cropper"` highlights the tool |
| `SiteFooter` | `Container`, `Group`, `Stack`, `Anchor`, `Divider`, `Badge` | |
| `ThemeToggle` | `ActionIcon` + `useMantineColorScheme` | Icon swapped via CSS so SSR never mismatches |
| `ScrollProgress`, `BackToTop` | CSS scroll timeline, `Affix` + `Transition` | |
| `Section` / `SectionHeader` / `Accent` | `Container`, `Title`, `Text` | Common section layout |
| `Scene` | SVG | Letterboxed "film frame" artwork reused by the hero, before/after and simulator |

### Landing sections (`website/src/landing/`)

| Section | Built from |
|---|---|
| `Hero`, `AppMock` | `Title`, `Button`, a CSS replica of the new desktop app window |
| `ProofStrip`, `Definition`, `Pain`, `Features`, `Steps`, `Audience` | `SimpleGrid`, `Paper`, `ThemeIcon`, `Badge` |
| `BeforeAfter` | native range input over two `Scene`s |
| `Simulator` | `Slider`, `Badge`, crop-box overlay on `Scene` |
| `BatchDemo` | `Progress`, `Badge`, `ScrollArea` terminal log |
| `OpenSource` | `Paper`, `List`, `ThemeIcon`, `Button` |
| `Cta` | gradient panel, `Title`, `Button` |
| `Comparison` | `Table` inside `Table.ScrollContainer` |
| `Faq` | `Accordion` (copy shared with the JSON-LD generator) |

### Web cropper (`website/src/cropper/`)

| Piece | Built from | Icon (Phosphor) |
|---|---|---|
| `CropDropzone` | `@mantine/dropzone` (+ full-page drop), `Button` for samples | `UploadSimple`, `Image`, `Plus` |
| `QueueGrid` | `Card`, `MediaThumb`, `Badge`, `ActionIcon` + `Tooltip` | `X`, `Trash`, `Warning`, `FilmStrip` |
| `ResultsList` | `Paper`, `Button`, `ThemeIcon`, empty state | `DownloadSimple`, `Tray` |
| `SettingsPanel` | `Slider`, `Select`, `Switch`, `Progress`, `Button` | `Lightning`, `CaretRight`, `ArrowsOutSimple` |
| `PreviewModal` | `Modal`, `LoadingOverlay`, `Kbd`, crop overlay, stats row | `Crop` |
| `StatusBadge` | `Badge` | – |
| Notifications | `@mantine/notifications` | – |

State and side effects live in the `useCropper` hook; detection, cropping, ffmpeg.wasm video handling and the zip
writer stay in `engine/*.js` and are unit-tested (`engine/*.test.ts`). Results are kept when settings change and are
re-run only if the options differ from the ones used to produce them.

Build: `npm run website:build` → `website/dist` (serve that folder; the SSR bundle is removed after prerendering).
