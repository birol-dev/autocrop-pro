import type { ReactNode } from "react";

export type FaqItem = {
  q: string;
  /** Rendered in the accordion. */
  a: ReactNode;
  /** Plain-text answer for the FAQPage JSON-LD. */
  text: string;
};

const answer = (text: string): Pick<FaqItem, "a" | "text"> => ({ a: text, text });

export const FAQS: FaqItem[] = [
  {
    q: "Are my files uploaded?",
    ...answer("No. Everything runs on your device. Cropping video in the browser downloads a 25 MB engine once."),
  },
  {
    q: "Browser or Windows app?",
    ...answer("Browser for a few files, on any computer. The Windows app for whole folders and big videos."),
  },
  {
    q: "Which file types work?",
    ...answer("JPG, PNG, WEBP, BMP, GIF, MP4, MOV and WEBM. The app also takes TIFF, MKV, AVI, FLV and WMV."),
  },
  {
    q: "Do I need anything else?",
    ...answer("Only FFmpeg, and only for video in the Windows app."),
  },
];
