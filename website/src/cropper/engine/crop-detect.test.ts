import { describe, expect, it } from "vitest";

import { applyPadding, detectImageCrop, evenCrop, unionCrops } from "./crop-detect.js";

/** RGBA frame filled with black, plus a `value`-grey rectangle of "content". */
function frame(width: number, height: number, box: { x: number; y: number; w: number; h: number }, value = 255) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
    }
  }
  return data;
}

describe("detectImageCrop", () => {
  it("finds the content box inside black bars", () => {
    const data = frame(100, 60, { x: 10, y: 8, w: 80, h: 44 });
    expect(detectImageCrop(data, 100, 60)).toEqual({ x: 10, y: 8, w: 80, h: 44 });
  });

  it("returns the full frame when nothing exceeds the threshold", () => {
    const data = frame(40, 30, { x: 0, y: 0, w: 0, h: 0 });
    expect(detectImageCrop(data, 40, 30)).toEqual({ x: 0, y: 0, w: 40, h: 30 });
  });

  it("returns the input size untouched for an empty image", () => {
    expect(detectImageCrop(new Uint8ClampedArray(0), 0, 0)).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });

  it("treats dim content as black until the tolerance drops below it", () => {
    const data = frame(100, 60, { x: 20, y: 10, w: 60, h: 40 }, 30);
    expect(detectImageCrop(data, 100, 60, { tolerance: 20 })).toEqual({ x: 0, y: 0, w: 100, h: 60 });
    expect(detectImageCrop(data, 100, 60, { tolerance: 5 })).toEqual({ x: 20, y: 10, w: 60, h: 40 });
  });

  it("ignores isolated noise pixels in the bars", () => {
    const data = frame(200, 200, { x: 50, y: 50, w: 100, h: 100 });
    const i = (5 * 200 + 5) * 4;
    data[i] = data[i + 1] = data[i + 2] = 255;
    expect(detectImageCrop(data, 200, 200)).toEqual({ x: 50, y: 50, w: 100, h: 100 });
  });

  it("supports packed RGB buffers", () => {
    const rgb = new Uint8Array(20 * 10 * 3);
    for (let y = 2; y < 8; y++) for (let x = 4; x < 16; x++) rgb.fill(200, (y * 20 + x) * 3, (y * 20 + x) * 3 + 3);
    expect(detectImageCrop(rgb, 20, 10, { channels: 3 })).toEqual({ x: 4, y: 2, w: 12, h: 6 });
  });
});

describe("applyPadding", () => {
  it("grows the crop by the padding on every side", () => {
    expect(applyPadding({ x: 30, y: 20, w: 40, h: 20 }, 200, 100)).toEqual({ x: 20, y: 10, w: 60, h: 40 });
  });

  it("clamps to the frame edges", () => {
    expect(applyPadding({ x: 80, y: 20, w: 20, h: 20 }, 100, 60)).toEqual({ x: 70, y: 10, w: 30, h: 40 });
    expect(applyPadding({ x: 5, y: 5, w: 50, h: 30 }, 100, 60)).toEqual({ x: 0, y: 0, w: 70, h: 50 });
  });

  it("honours a custom padding", () => {
    expect(applyPadding({ x: 30, y: 30, w: 10, h: 10 }, 100, 100, 4)).toEqual({ x: 26, y: 26, w: 18, h: 18 });
  });
});

describe("unionCrops", () => {
  it("falls back to the full frame without usable samples", () => {
    expect(unionCrops([], 1920, 1080)).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
    expect(unionCrops([{ x: 0, y: 0, w: 0, h: 0 }], 1920, 1080)).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
  });

  it("returns the bounding box of all letterboxed frames", () => {
    const crops = [
      { x: 0, y: 100, w: 1920, h: 800 },
      { x: 0, y: 120, w: 1920, h: 760 },
    ];
    expect(unionCrops(crops, 1920, 1080)).toEqual({ x: 0, y: 100, w: 1920, h: 800 });
  });

  it("ignores full-frame samples (fades) when letterboxed frames exist", () => {
    const crops = [
      { x: 0, y: 0, w: 1920, h: 1080 },
      { x: 0, y: 140, w: 1920, h: 800 },
    ];
    expect(unionCrops(crops, 1920, 1080)).toEqual({ x: 0, y: 140, w: 1920, h: 800 });
  });

  it("keeps the full frame when every sample is full-frame", () => {
    const full = { x: 0, y: 0, w: 640, h: 360 };
    expect(unionCrops([full, full], 640, 360)).toEqual(full);
  });
});

describe("evenCrop", () => {
  it("rounds every value down to an even number", () => {
    expect(evenCrop({ x: 3, y: 5, w: 101, h: 57 }, 200, 100)).toEqual({ x: 2, y: 4, w: 100, h: 56 });
  });

  it("keeps the box inside the frame", () => {
    expect(evenCrop({ x: 10, y: 0, w: 200, h: 50 }, 101, 50)).toEqual({ x: 10, y: 0, w: 90, h: 50 });
  });

  it("never returns a zero-sized box", () => {
    const out = evenCrop({ x: 0, y: 0, w: 1, h: 1 }, 100, 100);
    expect(out.w).toBeGreaterThanOrEqual(2);
    expect(out.h).toBeGreaterThanOrEqual(2);
  });
});
