import { describe, expect, it } from "vitest";

import { classifyFile, fileStem, getExtension, isRiskyWebFormat } from "./media.js";

describe("getExtension", () => {
  it("lower-cases the extension and handles missing ones", () => {
    expect(getExtension("Holiday.MP4")).toBe(".mp4");
    expect(getExtension("archive.tar.gz")).toBe(".gz");
    expect(getExtension("README")).toBe("");
  });
});

describe("classifyFile", () => {
  it("separates videos from images and rejects the rest", () => {
    expect(classifyFile("clip.MKV")).toBe("video");
    expect(classifyFile("shot.webp")).toBe("image");
    expect(classifyFile("notes.pdf")).toBeNull();
    expect(classifyFile("noextension")).toBeNull();
  });
});

describe("isRiskyWebFormat", () => {
  it("flags formats browsers rarely decode", () => {
    expect(isRiskyWebFormat("scan.TIFF")).toBe(true);
    expect(isRiskyWebFormat("clip.avi")).toBe(true);
    expect(isRiskyWebFormat("photo.jpg")).toBe(false);
    expect(isRiskyWebFormat("clip.mp4")).toBe(false);
  });
});

describe("fileStem", () => {
  it("strips directories and the last extension", () => {
    expect(fileStem("shots/final.cut.png")).toBe("final.cut");
    expect(fileStem("C:\\media\\clip.mov")).toBe("clip");
    expect(fileStem(".hidden")).toBe(".hidden");
    expect(fileStem("plain")).toBe("plain");
  });
});
