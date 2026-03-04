# AutoCrop Pro — Project Reference

> **Version:** 0.1.0 · **Identifier:** `com.autocrop.app` · **Platform:** Windows x64 (Tauri 2)

A native desktop application for automatically detecting and cropping black borders from images and videos. Built with a **Rust** backend and a **React + TypeScript** frontend, packaged as a native Windows app via **Tauri v2**.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Tech Stack](#tech-stack)
- [Backend — Rust (src-tauri)](#backend--rust-src-tauri)
  - [Data Types](#data-types)
  - [Tauri Commands (IPC API)](#tauri-commands-ipc-api)
  - [Internal Helpers](#internal-helpers)
  - [Tauri Events](#tauri-events)
  - [Plugins & Capabilities](#plugins--capabilities)
  - [Release Profile](#release-profile)
- [Frontend — React/TypeScript (src)](#frontend--reacttypescript-src)
  - [Entry Point](#entry-point)
  - [App Component](#app-component)
  - [TypeScript Types](#typescript-types)
  - [UI Components (shadcn/ui)](#ui-components-shadcnui)
  - [Utility Library](#utility-library)
- [Configuration Files](#configuration-files)
- [Build & Dev Commands](#build--dev-commands)
- [Output Directory](#output-directory)
- [External Dependencies](#external-dependencies)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Tauri Window                       │
│  ┌──────────────────────┬─────────────────────────┐  │
│  │     Main Content     │    Settings Sidebar     │  │
│  │  ┌────────────────┐  │  ┌───────────────────┐  │  │
│  │  │   Drop Zone    │  │  │ Tolerance Slider  │  │  │
│  │  └────────────────┘  │  │ Output Format     │  │  │
│  │  ┌────────────────┐  │  │ Padding Toggle    │  │  │
│  │  │  File Queue    │  │  │ Delete Originals  │  │  │
│  │  │  (card grid)   │  │  └───────────────────┘  │  │
│  │  └────────────────┘  │  ┌───────────────────┐  │  │
│  │                      │  │  Process Button   │  │  │
│  │  Modals:             │  └───────────────────┘  │  │
│  │  • Preview + Crop    │                         │  │
│  │  • Output Gallery    │                         │  │
│  └──────────────────────┴─────────────────────────┘  │
│                          │IPC│                        │
│  ┌───────────────────────┴────┴───────────────────┐  │
│  │              Rust Backend (lib.rs)              │  │
│  │  detect_crop_areas · process_files             │  │
│  │  list_output_files · open_output_folder        │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
native-windows-app/
├── index.html                  # HTML shell
├── package.json                # NPM dependencies & scripts
├── vite.config.ts              # Vite dev server (port 1420)
├── tailwind.config.js          # Tailwind + shadcn/ui theme tokens
├── postcss.config.js           # PostCSS (autoprefixer + tailwind)
├── tsconfig.json               # TS config (strict, path aliases)
├── tsconfig.node.json          # TS config for Vite/Node
├── components.json             # shadcn/ui component registry config
│
├── src/                        # ── Frontend ──
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Main application component (777 lines)
│   ├── index.css               # Global CSS + Tailwind directives
│   ├── lib/
│   │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
│   └── components/
│       └── ui/                 # shadcn/ui primitives
│           ├── button.tsx
│           ├── card.tsx
│           ├── checkbox.tsx
│           ├── dialog.tsx
│           ├── label.tsx
│           ├── select.tsx
│           ├── slider.tsx
│           ├── switch.tsx
│           └── tooltip.tsx
│
├── src-tauri/                  # ── Backend ──
│   ├── Cargo.toml              # Rust dependencies
│   ├── Cargo.lock              # Lockfile
│   ├── build.rs                # Tauri codegen build script
│   ├── tauri.conf.json         # Tauri app config (window, bundle, CSP)
│   ├── capabilities/
│   │   └── default.json        # Permission grants (fs, shell)
│   ├── icons/                  # App icons (PNG, ICO, ICNS)
│   └── src/
│       ├── main.rs             # Windows entry point (calls run())
│       └── lib.rs              # All backend logic (445 lines)
│
└── dist/                       # Vite build output (generated)
```

---

## Tech Stack

| Layer      | Technology                                     |
|------------|-------------------------------------------------|
| Framework  | Tauri v2.10.0                                   |
| Backend    | Rust 1.77.2+, `image` 0.25, `rayon`, `regex`   |
| Frontend   | React 18, TypeScript 5, Vite 5                  |
| Styling    | TailwindCSS 3.4, shadcn/ui (Radix primitives)  |
| Video      | FFmpeg (external CLI, must be on PATH)          |
| Packaging  | MSI (WiX) + NSIS installers                     |

---

## Backend — Rust (`src-tauri`)

All backend logic lives in **`src-tauri/src/lib.rs`** (445 lines).

### Data Types

| Struct           | Fields                                          | Usage                          |
|------------------|-------------------------------------------------|--------------------------------|
| `CropArea`       | `w: u32, h: u32, x: u32, y: u32`               | Crop rectangle (width, height, offset) |
| `ProcessOptions` | `tolerance: i32, output_format: String, padding: bool, delete_original: bool` | User settings from sidebar |
| `ProcessItem`    | `path: String, crop: CropArea`                  | Single file + its crop data    |
| `ProgressEvent`  | `current: usize, total: usize, message: String` | Emitted to frontend via events |
| `OutputFile`     | `name: String, path: String, file_type: String` | Gallery listing entry          |

### Tauri Commands (IPC API)

These are the functions exposed to the frontend via `invoke()`:

#### `detect_crop_areas`
```rust
async fn detect_crop_areas(file_path: String, tolerance: f32) -> Result<CropArea, String>
```
- Routes to `detect_video_crop()` or `detect_image_crop()` based on file extension.
- **Videos:** Runs `ffmpeg -vframes 30 -vf cropdetect` and parses `crop=W:H:X:Y` from stderr.
- **Images:** Opens with the `image` crate, builds per-row/column histograms, sweeps inward from edges to find content boundaries. Uses 1% noise floor suppression.

#### `process_files`
```rust
async fn process_files(window: Window, items: Vec<ProcessItem>, options: ProcessOptions) -> Result<(), String>
```
- Processes all files in parallel using **Rayon** (`par_iter`).
- Output goes to `Documents/AutoCrop_Output/`.
- Videos → FFmpeg crop filter; Images → `image` crate crop + save.
- Handles format conversion safety (prevents video→image cross-type).
- Emits `crop-progress` events to the frontend window.
- Optionally deletes originals on success.
- Applies 10px padding if enabled.

#### `list_output_files`
```rust
fn list_output_files() -> Result<Vec<OutputFile>, String>
```
- Lists all files in `Documents/AutoCrop_Output/`, sorted by name.
- Classifies each as `"video"` or `"image"` by extension.

#### `open_output_folder`
```rust
fn open_output_folder() -> Result<(), String>
```
- Opens the output folder in the system file manager (`explorer` on Windows, `open` on macOS, `xdg-open` on Linux).

### Internal Helpers

| Function             | Description                                              |
|----------------------|----------------------------------------------------------|
| `crop_regex()`       | Cached `OnceLock<Regex>` for parsing `crop=W:H:X:Y`     |
| `get_extension()`    | Extracts lowercase file extension from a path            |
| `is_video()`         | Checks extension against `VIDEO_EXTENSIONS` list         |
| `detect_video_crop()`| FFmpeg cropdetect wrapper (30 frames, configurable limit)|
| `detect_image_crop()`| Histogram-based edge detection for images                |
| `process_single_video()` | FFmpeg crop filter for one video file                |
| `process_single_image()` | Image crate crop + format-aware save (JPEG→RGB8)    |

### Tauri Events

| Event Name       | Payload          | Direction        | Description                    |
|------------------|------------------|------------------|--------------------------------|
| `crop-progress`  | `ProgressEvent`  | Backend→Frontend | Per-file progress during batch |

### Plugins & Capabilities

**Plugins registered in `run()`:**
- `tauri-plugin-fs` — Filesystem access
- `tauri-plugin-shell` — Shell command execution
- `tauri-plugin-log` — Logging (debug builds only)

**Capability grants** (`capabilities/default.json`):
- `core:default` — Core Tauri APIs
- `fs:default`, `fs:read-all` — Full filesystem read access
- `shell:allow-open` — Open URLs/paths in system apps

**Asset Protocol** enabled in `tauri.conf.json` with broad scope (`**`, `$HOME/**`, `$DOCUMENT/**`, etc.) for file previews.

### Release Profile

```toml
[profile.release]
panic = "abort"       # No unwind overhead
codegen-units = 1     # Maximum cross-crate optimization
lto = true            # Link Time Optimization
opt-level = "s"       # Optimize for binary size
strip = true          # Strip debug symbols
```

---

## Frontend — React/TypeScript (`src`)

### Entry Point

**`main.tsx`** → Mounts `<App />` into `#root` under `React.StrictMode`.

### App Component

**`App.tsx`** (777 lines) — Single monolithic component containing all UI and logic.

#### State Management

| State Variable    | Type                  | Purpose                           |
|-------------------|-----------------------|-----------------------------------|
| `files`           | `MediaFile[]`         | Queue of files to process         |
| `isProcessing`    | `boolean`             | Lock during batch processing      |
| `progress`        | `number`              | 0–100 progress percentage         |
| `progressMsg`     | `string`              | Status message from backend       |
| `previewFile`     | `MediaFile \| null`   | Currently previewed file          |
| `detectingCrop`   | `boolean`             | Loading state for crop detection  |
| `detectedCrop`    | `CropArea \| null`    | Current crop result               |
| `options`         | `ProcessOptions`      | User settings (tolerance, format) |
| `isDragHovering`  | `boolean`             | Visual feedback for drag-over     |
| `showGallery`     | `boolean`             | Gallery modal visibility          |
| `galleryFiles`    | `OutputFile[]`        | Files listed in gallery           |
| `lightboxIndex`   | `number \| null`      | Index of lightbox-selected file   |

#### Key Functions

| Function            | Description                                      |
|---------------------|--------------------------------------------------|
| `addFilesFromPaths` | Deduplicates and adds files with preview URLs     |
| `removeFile`        | Removes a file from the queue by ID               |
| `handlePreview`     | Opens preview modal, triggers crop detection      |
| `handleProcessAll`  | Detects missing crops, processes all, opens gallery |
| `openGallery`       | Fetches output files and shows gallery modal      |
| `closeGallery`      | Closes gallery and clears gallery state            |

#### File Input Methods

1. **Tauri Native Drag & Drop** — `getCurrentWebview().onDragDropEvent()` (handles `enter`, `over`, `leave`, `drop`)
2. **HTML Fallback** — `react-dropzone` (click-to-browse, `noDrag: true`)

#### Tolerance Debouncing
Changes to the tolerance slider are debounced (300ms). On change, all cached crops are invalidated and the current preview is re-detected.

#### Supported File Types

| Category | Extensions                                           |
|----------|------------------------------------------------------|
| Video    | `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.flv`, `.wmv` |
| Image    | `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.tiff`, `.tif`, `.gif` |

#### UI Sections

1. **Header** — App branding with drag region for window movement
2. **Drop Zone** — Adaptive size (large when empty, compact when files exist)
3. **File Queue** — Responsive card grid (1–4 columns) with thumbnails, crop badges, remove buttons
4. **Settings Sidebar** — Tolerance slider, format select, padding/delete toggles, process button
5. **Preview Modal** — Full media preview with visual crop overlay and detection status
6. **Gallery Modal** — Grid view of output files with lightbox navigation (prev/next)

### TypeScript Types

| Type                    | Purpose                                     |
|-------------------------|---------------------------------------------|
| `CropArea`              | Crop rectangle `{w, h, x, y}`              |
| `MediaFile`             | File in queue with preview and crop data    |
| `ProcessOptions`        | Settings object sent to backend             |
| `ProgressEventPayload`  | Progress event from backend                 |
| `OutputFile`            | Gallery file entry                          |

### UI Components (shadcn/ui)

All located in `src/components/ui/`, built on Radix UI primitives:

| Component   | Radix Primitive         | Usage                          |
|-------------|-------------------------|--------------------------------|
| `Button`    | `@radix-ui/react-slot`  | General actions                |
| `Card`      | —                       | Container styling              |
| `Checkbox`  | `@radix-ui/react-checkbox` | (Available, unused)         |
| `Dialog`    | `@radix-ui/react-dialog` | Preview + Gallery modals      |
| `Label`     | `@radix-ui/react-label` | Form labels                    |
| `Select`    | `@radix-ui/react-select` | Output format picker          |
| `Slider`    | `@radix-ui/react-slider` | Tolerance control             |
| `Switch`    | `@radix-ui/react-switch` | Padding + delete toggles      |
| `Tooltip`   | `@radix-ui/react-tooltip` | (Available, unused)          |

### Utility Library

**`src/lib/utils.ts`** exports `cn()` — merges class names using `clsx` + `tailwind-merge`.

---

## Configuration Files

| File                | Purpose                                               |
|---------------------|-------------------------------------------------------|
| `vite.config.ts`    | Dev server on port 1420, ignores `src-tauri/`, `@` alias → `./src` |
| `tailwind.config.js`| Dark mode, shadcn/ui theme tokens (HSL vars), container config |
| `postcss.config.js` | tailwindcss + autoprefixer                            |
| `tsconfig.json`     | Strict mode, `@/*` path mapping                      |
| `components.json`   | shadcn/ui config (style, aliases, registry)           |
| `tauri.conf.json`   | Window 1100×700, asset protocol, bundle config        |

---

## Build & Dev Commands

```bash
# Development (hot-reload frontend + Rust backend)
npm run tauri dev

# Production build (TypeScript → Vite → Tauri → MSI/NSIS)
npm run tauri build

# Frontend only (no Tauri shell)
npm run dev           # Vite dev server at localhost:1420
npm run build         # TypeScript check + Vite production build

# Backend only
cd src-tauri
cargo build           # Debug build
cargo build --release # Release build
cargo clean           # Remove all build artifacts
```

### Build Outputs

| Output                  | Path                                              |
|-------------------------|---------------------------------------------------|
| Release executable      | `src-tauri/target/release/app.exe`                |
| MSI installer           | `src-tauri/target/release/bundle/msi/AutoCrop Pro_0.1.0_x64_en-US.msi` |
| NSIS installer          | `src-tauri/target/release/bundle/nsis/AutoCrop Pro_0.1.0_x64-setup.exe` |

---

## Output Directory

All processed files are saved to:

```
%USERPROFILE%\Documents\AutoCrop_Output\
```

Files are named `{original_stem}_cropped.{ext}`.

---

## External Dependencies

### Runtime Requirements

- **FFmpeg** must be available on `PATH` for video crop detection and processing. Image-only workflows do not require FFmpeg.

### NPM Dependencies

| Package                       | Purpose                              |
|-------------------------------|--------------------------------------|
| `react` / `react-dom`         | UI framework                         |
| `@tauri-apps/api`             | Tauri IPC (`invoke`, `convertFileSrc`, events) |
| `@tauri-apps/plugin-fs`       | File system access from frontend     |
| `@tauri-apps/plugin-shell`    | Shell operations from frontend       |
| `react-dropzone`              | HTML file input fallback             |
| `sonner`                      | Toast notifications                  |
| `lucide-react`                | Icon library                         |
| `class-variance-authority`    | Component variant system             |
| `clsx` / `tailwind-merge`     | Conditional class concatenation      |
| `@radix-ui/*`                 | Accessible UI primitives             |

### Rust Crate Dependencies

| Crate                | Purpose                              |
|----------------------|--------------------------------------|
| `tauri` 2.10         | App framework + IPC + window mgmt   |
| `image` 0.25         | Image loading, cropping, saving      |
| `rayon` 1.10         | Parallel file processing             |
| `regex` 1.11         | FFmpeg output parsing                |
| `serde` / `serde_json` | (De)serialization for IPC         |
| `dirs` 5.0           | System directory resolution          |
| `tauri-plugin-fs`    | File system plugin                   |
| `tauri-plugin-shell` | Shell plugin                         |
| `tauri-plugin-log`   | Debug logging                        |
| `log` 0.4            | Logging macros                       |
