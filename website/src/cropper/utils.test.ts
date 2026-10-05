import { describe, expect, it } from "vitest";

import type { Item, Options } from "./types";
import { displayedCrop } from "./useCropper";
import { errorMessage, formatBytes } from "./utils";

describe("formatBytes", () => {
  it("scales through B, KB and MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("errorMessage", () => {
  it("prefers the error message and falls back otherwise", () => {
    expect(errorMessage(new Error("boom"), "fallback")).toBe("boom");
    expect(errorMessage(new Error(""), "fallback")).toBe("fallback");
    expect(errorMessage("nope", "fallback")).toBe("fallback");
  });
});

describe("displayedCrop", () => {
  const options: Options = { tolerance: 20, padding: false, outputFormat: "same" };
  const item = {
    crop: { x: 30, y: 20, w: 40, h: 20 },
    naturalW: 200,
    naturalH: 100,
    detectKey: "20",
  } as Item;

  it("shows the detected crop while its tolerance matches the settings", () => {
    expect(displayedCrop(item, options)).toEqual(item.crop);
  });

  it("hides a crop that was detected with a different tolerance", () => {
    expect(displayedCrop(item, { ...options, tolerance: 35 })).toBeNull();
  });

  it("adds the 10px padding preview when enabled", () => {
    expect(displayedCrop(item, { ...options, padding: true })).toEqual({ x: 20, y: 10, w: 60, h: 40 });
  });

  it("returns null before anything was detected", () => {
    expect(displayedCrop({ ...item, crop: null } as Item, options)).toBeNull();
  });
});
