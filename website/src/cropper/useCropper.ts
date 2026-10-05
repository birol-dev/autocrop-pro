import { useCallback, useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";

import { applyPadding } from "./engine/crop-detect.js";
import { BATCH_WARN_COUNT, VIDEO_WARN_BYTES, classifyFile, fileStem, isRiskyWebFormat } from "./engine/media.js";
import { cropImageFile, detectFromImageFile } from "./engine/process-image.js";
import { cropVideoFile, detectFromVideoFile, detectVideoCropFfmpeg, preloadFfmpeg } from "./engine/process-video.js";
import { buildZip } from "./engine/zip.js";
import { loadSamples } from "./samples";
import type { CropArea, Item, Options, OutputFormat, Progress } from "./types";
import { downloadBlob, errorMessage } from "./utils";

const optionsKey = (o: Options) => `${o.tolerance}|${o.padding}|${o.outputFormat}`;

const IDLE_PROGRESS: Progress = { visible: false, ratio: 0, message: "" };

export type CropperTab = "queue" | "results";

/** The crop to show/apply for an item under the current options, or null if it isn't detected yet. */
export function displayedCrop(item: Item, options: Options): CropArea | null {
  if (!item.crop || !item.naturalW || !item.naturalH) return null;
  if (item.detectKey !== String(options.tolerance)) return null;
  return options.padding ? applyPadding(item.crop, item.naturalW, item.naturalH, 10) : item.crop;
}

const notify = (message: string, error = false) =>
  notifications.show({
    message,
    color: error ? "red" : "brand",
    autoClose: error ? 7000 : 5000,
    withBorder: true,
  });

/**
 * All cropper state + side effects. The queue lives in a ref (the source of truth, so the
 * async detect/process loops always see fresh data) and is mirrored into React state for rendering.
 */
export function useCropper() {
  const [items, setItems] = useState<Item[]>([]);
  const [options, setOptionsState] = useState<Options>({ tolerance: 20, padding: false, outputFormat: "same" });
  const [tab, setTab] = useState<CropperTab>("queue");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<Progress>(IDLE_PROGRESS);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(false);

  const itemsRef = useRef<Item[]>([]);
  const optionsRef = useRef(options);
  const processingRef = useRef(false);
  const ffmpegPreloadStarted = useRef(false);

  const commit = (next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  };

  const patch = useCallback((id: string, changes: Partial<Item>) => {
    const next = itemsRef.current.map((it) => (it.id === id ? { ...it, ...changes } : it));
    itemsRef.current = next;
    setItems(next);
  }, []);

  const setProgressState = (visible: boolean, ratio: number, message: string) =>
    setProgress({ visible, ratio, message });

  // Release object URLs when leaving the page.
  useEffect(
    () => () => {
      for (const it of itemsRef.current) {
        URL.revokeObjectURL(it.previewUrl);
        if (it.thumbnailUrl) URL.revokeObjectURL(it.thumbnailUrl);
      }
    },
    [],
  );

  const maybePreloadFfmpeg = () => {
    if (ffmpegPreloadStarted.current) return;
    if (!itemsRef.current.some((f) => f.type === "video")) return;
    ffmpegPreloadStarted.current = true;
    setProgressState(true, 0, "Loading in-browser video engine…");
    preloadFfmpeg((msg: string) => setProgressState(true, 0, msg))
      .then(() => {
        if (!processingRef.current) setProgress(IDLE_PROGRESS);
      })
      .catch((err: unknown) => {
        ffmpegPreloadStarted.current = false;
        if (!processingRef.current) setProgress(IDLE_PROGRESS);
        notify(`Video engine failed to load. Images still work. ${errorMessage(err, "")}`, true);
      });
  };

  const addFiles = useCallback((incoming: File[]) => {
    if (processingRef.current || !incoming.length) return;

    const existing = new Set(itemsRef.current.map((f) => `${f.name}:${f.file.size}:${f.file.lastModified}`));
    const fresh: Item[] = [];

    for (const file of incoming) {
      const type = classifyFile(file.name) as "image" | "video" | null;
      if (!type) {
        notify(`Skipped ${file.name} — unsupported format.`, true);
        continue;
      }
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (existing.has(key)) continue;
      existing.add(key);

      fresh.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type,
        previewUrl: URL.createObjectURL(file),
        thumbnailUrl: null,
        crop: null,
        naturalW: 0,
        naturalH: 0,
        detectKey: null,
        status: "queued",
        error: null,
        resultBlob: null,
        resultName: null,
        resultKey: null,
        risky: isRiskyWebFormat(file.name),
        oversized: type === "video" && file.size >= VIDEO_WARN_BYTES,
      });
    }
    if (!fresh.length) return;

    commit([...itemsRef.current, ...fresh]);
    setTab("queue");

    if (itemsRef.current.length > BATCH_WARN_COUNT) {
      notify(`That's ${itemsRef.current.length} files. The Windows app is faster for big batches.`);
    }
    if (fresh.some((f) => f.oversized)) {
      notify("A video is over 80MB. The browser may run out of memory — the Windows app handles large files.");
    }
    maybePreloadFfmpeg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSamples = useCallback(async () => {
    setLoadingSamples(true);
    try {
      addFiles(await loadSamples(3));
    } catch (err) {
      notify(errorMessage(err, "Could not load the sample images."), true);
    } finally {
      setLoadingSamples(false);
    }
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    if (processingRef.current) return;
    const item = itemsRef.current.find((f) => f.id === id);
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
      if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
    }
    commit(itemsRef.current.filter((f) => f.id !== id));
    setPreviewId((p) => (p === id ? null : p));
  }, []);

  const clearAll = useCallback(() => {
    if (processingRef.current) return;
    for (const it of itemsRef.current) {
      URL.revokeObjectURL(it.previewUrl);
      if (it.thumbnailUrl) URL.revokeObjectURL(it.thumbnailUrl);
    }
    commit([]);
    setPreviewId(null);
  }, []);

  /** Detects the crop for one file under the current tolerance (cached per tolerance). */
  const ensureCrop = useCallback(
    async (id: string, onStatus?: (msg: string) => void): Promise<Item> => {
      const item = itemsRef.current.find((f) => f.id === id);
      if (!item) throw new Error("File was removed.");
      const key = String(optionsRef.current.tolerance);
      if (item.crop && item.detectKey === key) return item;

      const wasDone = item.status === "done";
      patch(id, { status: "detecting", error: null });
      const tolerance = optionsRef.current.tolerance;

      try {
        let detected: { crop: CropArea; width: number; height: number };
        let thumbnailUrl: string | null = null;

        if (item.type === "image") {
          detected = await detectFromImageFile(item.file, tolerance);
        } else {
          try {
            detected = await detectFromVideoFile(item.file, tolerance);
          } catch {
            onStatus?.("Analyzing video with FFmpeg engine…");
            const result = await detectVideoCropFfmpeg(item.file, tolerance, onStatus);
            detected = result;
            if (result.thumbnailBlob && !item.thumbnailUrl) thumbnailUrl = URL.createObjectURL(result.thumbnailBlob);
          }
        }

        const changes: Partial<Item> = {
          crop: detected.crop,
          naturalW: detected.width,
          naturalH: detected.height,
          detectKey: String(tolerance),
          status: wasDone ? "done" : "ready",
          error: null,
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        };
        patch(id, changes);
        return { ...item, ...changes };
      } catch (err) {
        const message = errorMessage(err, "Detection failed.");
        patch(id, { status: wasDone ? "done" : "error", error: message });
        throw err;
      }
    },
    [patch],
  );

  const setOptions = useCallback((changes: Partial<Options>) => {
    const next = { ...optionsRef.current, ...changes };
    optionsRef.current = next;
    setOptionsState(next);

    if (changes.tolerance !== undefined) {
      // Earlier detections are stale now; they get re-run lazily (preview) or when processing.
      commit(
        itemsRef.current.map((it) => ({
          ...it,
          crop: null,
          detectKey: null,
          error: null,
          status: it.status === "ready" || it.status === "error" ? "queued" : it.status,
        })),
      );
    }
  }, []);

  const setTolerance = useCallback((tolerance: number) => setOptions({ tolerance }), [setOptions]);
  const setPadding = useCallback((padding: boolean) => setOptions({ padding }), [setOptions]);
  const setOutputFormat = useCallback((outputFormat: OutputFormat) => setOptions({ outputFormat }), [setOptions]);

  // Keep the preview's crop fresh: detect on open, and re-detect (debounced) when the tolerance moves.
  const lastPreview = useRef<string | null>(null);
  useEffect(() => {
    if (!previewId) {
      lastPreview.current = null;
      return;
    }
    const delay = lastPreview.current === previewId ? 300 : 0;
    lastPreview.current = previewId;
    const timer = setTimeout(() => {
      if (processingRef.current) return;
      ensureCrop(previewId).catch(() => {});
    }, delay);
    return () => clearTimeout(timer);
  }, [previewId, options.tolerance, ensureCrop]);

  const processAll = useCallback(async () => {
    if (processingRef.current || !itemsRef.current.length) return;
    processingRef.current = true;
    setProcessing(true);
    setPreviewId(null);

    const ids = itemsRef.current.map((f) => f.id);
    const total = ids.length;
    let done = 0;
    let failures = 0;

    for (const id of ids) {
      const current = itemsRef.current.find((f) => f.id === id);
      if (!current) continue;

      if (current.status === "done" && current.resultBlob && current.resultKey === optionsKey(optionsRef.current)) {
        done += 1;
        setProgressState(true, done / total, `Already processed ${current.name}`);
        continue;
      }

      patch(id, { status: "processing", error: null });
      setProgressState(true, done / total, `Detecting ${current.name}…`);

      try {
        const item = await ensureCrop(id, (msg) => setProgressState(true, done / total, msg));
        const crop = item.crop;
        if (!crop) throw new Error("No crop area was detected.");
        patch(id, { status: "processing" });
        setProgressState(true, (done + 0.4) / total, `Cropping ${item.name}…`);

        const { outputFormat, padding } = optionsRef.current;
        let blob: Blob;
        let ext: string;
        if (item.type === "image") {
          const result = await cropImageFile(item.file, crop, outputFormat, padding);
          blob = result.blob;
          ext = result.ext;
        } else {
          const result = await cropVideoFile(
            item.file,
            crop,
            padding,
            item.naturalW,
            item.naturalH,
            (msg: string) => setProgressState(true, (done + 0.45) / total, msg),
            (ratio: number) => setProgressState(true, (done + 0.45 + ratio * 0.5) / total, `Encoding ${item.name}…`),
          );
          blob = result.blob;
          ext = result.ext;
        }
        patch(id, {
          status: "done",
          resultBlob: blob,
          resultName: `${fileStem(item.name)}_cropped.${ext}`,
          resultKey: optionsKey(optionsRef.current),
        });
      } catch (err) {
        failures += 1;
        patch(id, { status: "error", error: errorMessage(err, "Processing failed.") });
      }

      done += 1;
      const after = itemsRef.current.find((f) => f.id === id);
      setProgressState(true, done / total, after?.error ? `Error: ${after.name}` : `Processed ${after?.name ?? ""}`);
    }

    processingRef.current = false;
    setProcessing(false);
    setProgress(IDLE_PROGRESS);
    setTab("results");

    if (failures) {
      notify(
        `${failures} file${failures === 1 ? "" : "s"} failed. The Windows app handles large or unusual formats.`,
        true,
      );
    } else {
      notify("Done. Download from Results — files never left this tab.");
    }
  }, [ensureCrop, patch]);

  const downloadOne = useCallback((id: string) => {
    const item = itemsRef.current.find((f) => f.id === id);
    if (item?.resultBlob && item.resultName) downloadBlob(item.resultBlob, item.resultName);
  }, []);

  const downloadAll = useCallback(async () => {
    const ready = itemsRef.current.filter((f) => f.resultBlob && f.resultName);
    if (!ready.length) return;
    if (ready.length === 1) {
      downloadBlob(ready[0].resultBlob as Blob, ready[0].resultName as string);
      return;
    }
    try {
      const zip = await buildZip(ready.map((f) => ({ name: f.resultName as string, blob: f.resultBlob as Blob })));
      downloadBlob(zip, "autocrop-results.zip");
    } catch (err) {
      notify(errorMessage(err, "Could not build the zip."), true);
    }
  }, []);

  return {
    items,
    options,
    tab,
    setTab,
    processing,
    progress,
    previewId,
    setPreviewId,
    loadingSamples,
    addFiles,
    addSamples,
    removeFile,
    clearAll,
    setTolerance,
    setPadding,
    setOutputFormat,
    processAll,
    downloadOne,
    downloadAll,
  };
}

export type Cropper = ReturnType<typeof useCropper>;
