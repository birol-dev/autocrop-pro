/** Letterboxed demo pictures served from /samples/, rasterised to PNG on demand. */
export const SAMPLE_NAMES = ["sunset-beach", "mountain-lake", "pine-forest", "city-night", "portrait-study"] as const;

async function rasterize(name: string): Promise<File> {
  const res = await fetch(`/samples/${name}.svg`);
  if (!res.ok) throw new Error(`Could not load sample ${name}.`);
  const svg = await res.text();

  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1600;
    canvas.height = img.naturalHeight || 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error(`Could not render sample ${name}.`);
    return new File([blob], `${name}.png`, { type: "image/png", lastModified: 1 });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function loadSamples(count = 3): Promise<File[]> {
  return Promise.all(SAMPLE_NAMES.slice(0, count).map(rasterize));
}
