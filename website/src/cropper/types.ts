export type CropArea = { x: number; y: number; w: number; h: number };

export type ItemStatus = "queued" | "detecting" | "ready" | "processing" | "done" | "error";

export type Item = {
  id: string;
  file: File;
  name: string;
  type: "image" | "video";
  previewUrl: string;
  /** Poster frame produced by the FFmpeg fallback when the browser can't decode the video itself. */
  thumbnailUrl: string | null;
  crop: CropArea | null;
  naturalW: number;
  naturalH: number;
  /** The tolerance the current `crop` was detected with. */
  detectKey: string | null;
  status: ItemStatus;
  error: string | null;
  resultBlob: Blob | null;
  resultName: string | null;
  /** Options signature the result was produced with, so changed settings trigger a re-run. */
  resultKey: string | null;
  risky: boolean;
  oversized: boolean;
};

export type OutputFormat = "same" | "png" | "jpg" | "webp";

export type Options = {
  tolerance: number;
  padding: boolean;
  outputFormat: OutputFormat;
};

export type Progress = { visible: boolean; ratio: number; message: string };
