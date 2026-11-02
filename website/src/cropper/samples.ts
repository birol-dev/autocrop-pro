/** Letterboxed demo photos served from /samples/. */
export const SAMPLE_NAMES = ["coast-letterbox", "desert-road-letterbox", "mountain-lake-pillarbox"] as const;

async function loadSample(name: string): Promise<File> {
  const res = await fetch(`/samples/${name}.jpg`);
  if (!res.ok) throw new Error(`Could not load sample ${name}.`);
  return new File([await res.blob()], `${name}.jpg`, { type: "image/jpeg", lastModified: 1 });
}

export function loadSamples(count = 3): Promise<File[]> {
  return Promise.all(SAMPLE_NAMES.slice(0, count).map(loadSample));
}
