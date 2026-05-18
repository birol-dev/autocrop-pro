# AutoCrop Pro

A native desktop application for automatically detecting and cropping black borders from images and videos. Built with a **Rust** backend and a **React + TypeScript** frontend, packaged as a fast, lightweight native Windows app via **Tauri v2**.

---

## Features

- **Auto-detect crop regions** — Images analyzed via histogram edge detection; videos processed through FFmpeg cropdetect
- **Batch processing** — Process hundreds of files in parallel using Rayon
- **Real-time preview** — Visual crop overlay with live detection feedback
- **Multiple output formats** — PNG (lossless), JPEG (compressed), WebP, or keep original
- **Tolerance control** — Fine-tune how aggressively borders are detected (0-100%)
- **Padding option** — Add a 10px buffer around the crop edge
- **Output gallery** — Browse, preview, and lightbox processed files
- **Delete originals** — Optionally remove source files after successful processing

---

## Architecture Overview

AutoCrop Pro is a **Tauri v2** application with two distinct layers:

```

+-------------------------------------------------------+
|                    Tauri Window                        |
|  +--------------------------+------------------------+ |
|  |     Main Content         |    Settings Sidebar    | |
|  |  +--------------------+  |  +------------------+  | |
|  |  |   Drop Zone        |  |  | Tolerance Slider |  | |
|  |  +--------------------+  |  | Output Format    |  | |
|  |  +--------------------+  |  | Padding Toggle   |  | |
|  |  |  File Queue        |  |  | Delete Originals |  | |
|  |  +--------------------+  |  +------------------+  | |
|  |                          |  +------------------+  | |
|  |  Modals:                 |  |  Process Button  |  | |
|  |  . Preview + Crop        |  +------------------+  | |
|  |  . Output Gallery        |                         | |
|  +--------------------------+-------------------------+ |
|                          |IPC|                          |
|  +-----------------------+----+-----------------------+ |
|  |             Rust Backend (lib.rs)                  | |
|  |  detect_crop_areas . process_files                | |
|  |  list_output_files . open_output_folder            | |
|  +----------------------------------------------------+ |
+---------------------------------------------------------+

```

### Frontend (React + TypeScript)
The user interface lives in `src/`. It handles everything the user sees and interacts with — drag-and-drop zone, file queue, settings sidebar, preview modals, and the output gallery.

### Backend (Rust)
All OS-level logic lives in `src-tauri/src/lib.rs`. The backend:
- Interacts with the filesystem
- Spawns FFmpeg for video processing
- Performs pixel-level image analysis
- Processes files in parallel using the `rayon` crate

### The Bridge (IPC)
Communication between frontend and backend uses Tauri's IPC system:
- **Frontend to Backend**: `invoke("process_files", { items, options })` sends commands to Rust
- **Backend to Frontend**: `window.emit("crop-progress", ...)` pushes progress updates to the UI

---

## How Auto-Crop Works

### For Images
The backend loads every pixel, builds per-row and per-column histograms of content pixels, and sweeps inward from each edge to find where meaningful content begins. A noise floor of 1% prevents single-pixel artifacts from affecting results.

### For Videos
The backend runs `ffmpeg -vf cropdetect` on 30 sample frames and parses the `crop=W:H:X:Y` output to determine the optimal crop region.

---

## Tech Stack

| Layer      | Technology                                     |
|------------|-------------------------------------------------|
| Framework  | Tauri v2.10.0                                   |
| Backend    | Rust 1.77.2+, image 0.25, rayon, regex         |
| Frontend   | React 18, TypeScript 5, Vite 5                  |
| Styling    | TailwindCSS 3.4, shadcn/ui (Radix primitives)   |
| Video      | FFmpeg (external CLI, must be on PATH)          |
| Packaging  | MSI (WiX) + NSIS installers                     |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Rust** 1.77.2+ (via rustup)
- **FFmpeg** (required for video support; must be on PATH)
- **WebView2** runtime (included on modern Windows 10/11)

---

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd native-windows-app

# Install frontend dependencies
npm install

# Run in development mode (hot-reload frontend + Rust backend)
npm run tauri dev

# Build for production (generates MSI + NSIS installers)
npm run tauri build
```

### Available Scripts

| Command                  | Description                                      |
|--------------------------|--------------------------------------------------|
| `npm run tauri dev`      | Development mode with hot-reload                 |
| `npm run tauri build`    | Production build (creates installers)            |
| `npm run dev`            | Vite dev server only (frontend at localhost:1420)|
| `npm run build`          | TypeScript check + Vite production build         |
| `cd src-tauri && cargo build --release` | Build Rust backend only        |

### Build Outputs

| Output                  | Path                                                    |
|-------------------------|---------------------------------------------------------|
| Release executable      | `src-tauri/target/release/app.exe`                      |
| MSI installer           | `src-tauri/target/release/bundle/msi/AutoCrop Pro_0.1.0_x64_en-US.msi` |
| NSIS installer          | `src-tauri/target/release/bundle/nsis/AutoCrop Pro_0.1.0_x64-setup.exe` |

---

## Usage

1. **Add files** — Drag and drop media files onto the drop zone, or click to browse
2. **Adjust settings** — Use the sidebar to set detection tolerance, output format, padding, and whether to delete originals
3. **Preview** — Click any file to preview it with a visual crop overlay; the crop is detected automatically
4. **Process** — Click "Process Files" to batch-crop everything; processed files go to `Documents/AutoCrop_Output/`
5. **Browse output** — The gallery opens automatically after processing, showing all cropped files

### Supported File Types

| Category | Extensions                                                           |
|----------|----------------------------------------------------------------------|
| Video    | `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.flv`, `.wmv`             |
| Image    | `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.tiff`, `.tif`, `.gif`   |

---

## Project Structure

```
native-windows-app/
+-- index.html                   # HTML shell
+-- package.json                 # NPM dependencies and scripts
+-- vite.config.ts               # Vite dev server config
+-- tailwind.config.js           # Tailwind + shadcn/ui theme
+-- tsconfig.json                # TypeScript config
+-- components.json              # shadcn/ui registry config
|
+-- src/                         # --- Frontend (React/TS) ---
|   +-- main.tsx                 # React root mount
|   +-- App.tsx                  # Main component (~776 lines)
|   +-- index.css                # Tailwind CSS + global styles
|   +-- lib/
|   |   +-- utils.ts             # cn() utility
|   +-- components/
|       +-- ui/                  # shadcn/ui primitives
|           +-- button.tsx, card.tsx, checkbox.tsx
|           +-- dialog.tsx, label.tsx, select.tsx
|           +-- slider.tsx, switch.tsx, tooltip.tsx
|
+-- src-tauri/                   # --- Backend (Rust) ---
|   +-- Cargo.toml               # Rust dependencies
|   +-- tauri.conf.json          # Tauri app config
|   +-- capabilities/
|   |   +-- default.json         # Permission grants
|   +-- icons/                   # App icons
|   +-- src/
|       +-- main.rs              # Windows entry point
|       +-- lib.rs               # All backend logic (~444 lines)
|
+-- LICENSE                      # MIT License
+-- README.md                    # This file
```

---

## Backend API

The Rust backend exposes these commands to the frontend via Tauri IPC:

| Command               | Description                                         |
|-----------------------|-----------------------------------------------------|
| `detect_crop_areas`   | Detect crop boundaries for an image or video file   |
| `process_files`       | Batch-process files with crop + format conversion   |
| `list_output_files`   | List processed files in the output directory        |
| `open_output_folder`  | Open the output folder in the system file manager   |

---

## Output Directory

All processed files are saved to:

```
%USERPROFILE%\Documents\AutoCrop_Output\
```

Files are named `{original_stem}_cropped.{ext}`.

---

## License

MIT — see [LICENSE](LICENSE) for details.
