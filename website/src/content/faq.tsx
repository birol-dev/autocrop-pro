import type { ReactNode } from "react";
import { Anchor, Code } from "@mantine/core";

export type FaqItem = {
  q: string;
  /** Rendered in the accordion. */
  a: ReactNode;
  /** Plain-text answer for the FAQPage JSON-LD. */
  text: string;
};

const link = (href: string, label: string) => (
  <Anchor href={href} inherit fw={600}>
    {label}
  </Anchor>
);

export const FAQS: FaqItem[] = [
  {
    q: "What is AutoCrop Pro?",
    a: (
      <>
        AutoCrop Pro is a free, open-source tool that automatically detects and removes black borders, letterboxes, and
        pillarboxes from images and videos. Use the {link("/cropper/", "in-browser cropper")} for a few files, or the
        Windows desktop app for huge offline batches.
      </>
    ),
    text: "AutoCrop Pro is a free, open-source tool that automatically detects and removes black borders, letterboxes, and pillarboxes from images and videos. Use the in-browser cropper for a few files, or the Windows desktop app for huge offline batches.",
  },
  {
    q: "Does AutoCrop Pro need an internet connection?",
    a: (
      <>
        The Windows app is a native Tauri program that runs entirely on your PC — no files, telemetry, or tracking leave
        your machine. The website cropper also never uploads your media to AutoCrop Pro; it runs in this tab. Video in
        the browser loads a local FFmpeg engine from a CDN once.
      </>
    ),
    text: "The Windows app is a native Tauri program that runs entirely on your PC. The website cropper runs in your tab — files are not uploaded to AutoCrop Pro. Video cropping in the browser loads a local FFmpeg engine from a CDN once.",
  },
  {
    q: "How does edge detection work?",
    a: (
      <>
        For images, AutoCrop Pro builds per-row and per-column brightness histograms and sweeps inward from each edge.
        The Windows app uses FFmpeg <Code>cropdetect</Code> on 30 sample frames for video. The browser cropper uses the
        same histogram on sampled frames, then <Code>ffmpeg.wasm</Code> to encode.
      </>
    ),
    text: "For images, AutoCrop Pro builds per-row and per-column brightness histograms and sweeps inward from each edge. The Windows app uses FFmpeg cropdetect on 30 sample frames for video. The browser cropper uses the same histogram on sampled frames, then ffmpeg.wasm to encode.",
  },
  {
    q: "Is FFmpeg required?",
    a: (
      <>
        Only for video in the <strong>Windows app</strong>: install FFmpeg and add it to your PATH. Image cropping in the
        app needs no extra dependencies. The {link("/cropper/", "browser cropper")} loads an in-tab FFmpeg engine for
        video — no PATH install.
      </>
    ),
    text: "Only for video in the Windows app: install FFmpeg and add it to your PATH. Image cropping in the app needs no extra dependencies. The browser cropper loads an in-tab FFmpeg engine for video — no PATH install.",
  },
  {
    q: "Where do cropped files go?",
    a: (
      <>
        The Windows app saves to <Code>%USERPROFILE%\Documents\AutoCrop_Output\</Code> — named{" "}
        <Code>{"{original}_cropped.{ext}"}</Code>. The browser cropper downloads to your Downloads folder. Source files
        are never modified unless you enable Delete Originals in the desktop app.
      </>
    ),
    text: "The Windows app saves to %USERPROFILE%\Documents\AutoCrop_Output\ as {original}_cropped.{ext}. The browser cropper downloads files to your Downloads folder. Source files are never modified unless you enable Delete Originals in the desktop app.",
  },
  {
    q: "What file formats does AutoCrop Pro support?",
    a: (
      <>
        <strong>Images:</strong> JPG, PNG, WEBP, BMP, GIF, TIFF (TIFF is desktop-only). <strong>Videos:</strong> MP4,
        MOV, MKV, AVI, WEBM, FLV. The browser tool works best with common web formats (JPG/PNG/WEBP/MP4/WEBM). Huge or
        unusual videos should use the Windows app with FFmpeg on PATH.
      </>
    ),
    text: "Images: JPG, PNG, WEBP, BMP, GIF, TIFF (TIFF is desktop-only). Videos: MP4, MOV, MKV, AVI, WEBM, FLV. The browser tool works best with JPG/PNG/WEBP/GIF/BMP and MP4/MOV/WEBM. Large or unusual videos should use the Windows app.",
  },
  {
    q: "How is AutoCrop Pro different from FFmpeg cropdetect scripts?",
    a: (
      <>
        AutoCrop Pro wraps FFmpeg cropdetect and Rust edge detection in a visual interface with live preview, batch
        queue, and parallel processing. You avoid writing one-off shell scripts and see exactly what will be cropped
        before processing hundreds of files.
      </>
    ),
    text: "AutoCrop Pro wraps FFmpeg cropdetect and histogram edge detection in a visual interface with live preview, batch queue, and parallel processing on Windows. You avoid writing one-off shell scripts and see exactly what will be cropped before processing hundreds of files.",
  },
  {
    q: "macOS or Linux support?",
    a: (
      <>
        The in-browser cropper works on any modern desktop browser, including macOS and Linux. Native installers
        currently target Windows 10/11 (MSI + NSIS). macOS and Linux packages are planned.
      </>
    ),
    text: "The in-browser cropper works on any modern desktop browser, including macOS and Linux. The native installer currently targets Windows 10/11 (MSI and NSIS). Native macOS and Linux packages are planned.",
  },
  {
    q: "Do files get uploaded when I crop on the website?",
    a: (
      <>
        No. The {link("/cropper/", "web cropper")} processes files in your browser tab. They are not sent to AutoCrop Pro
        servers. Video cropping downloads a local FFmpeg WebAssembly engine once from a public CDN (~25MB, cached after
        that).
      </>
    ),
    text: "No. The web cropper processes files in your browser tab. They are not sent to AutoCrop Pro servers. Video cropping downloads a local FFmpeg WebAssembly engine once from a public CDN.",
  },
  {
    q: "When should I use the Windows app instead of the browser?",
    a: (
      <>
        Use the browser for a handful of images or short videos. Use the Windows app for 500+ files, TIFF, WMV/AVI/MKV,
        huge videos, custom output folders, and delete-originals. The app uses parallel Rust and system FFmpeg.
      </>
    ),
    text: "Use the browser for a handful of images or short videos. Use the Windows app for 500+ files, TIFF, WMV/AVI/MKV, huge videos, custom output folders, and delete-originals. The app uses parallel Rust and system FFmpeg.",
  },
];
