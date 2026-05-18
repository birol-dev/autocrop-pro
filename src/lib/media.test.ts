import { describe, it, expect } from "vitest";
import { classifyFile, VIDEO_EXTENSIONS, IMAGE_EXTENSIONS } from "./media";

describe("classifyFile", () => {
    it("classifies .mp4 as video", () => {
        expect(classifyFile("video.mp4")).toBe("video");
    });

    it("classifies .MOV as video (case insensitive)", () => {
        expect(classifyFile("clip.MOV")).toBe("video");
    });

    it("classifies .png as image", () => {
        expect(classifyFile("photo.png")).toBe("image");
    });

    it("classifies .JPG as image (case insensitive)", () => {
        expect(classifyFile("snapshot.JPG")).toBe("image");
    });

    it("returns null for unknown extension", () => {
        expect(classifyFile("file.txt")).toBeNull();
    });

    it("returns null for file with no extension", () => {
        expect(classifyFile("README")).toBeNull();
    });

    it("handles paths with directories", () => {
        expect(classifyFile("/home/user/videos/capture.mp4")).toBe("video");
        expect(classifyFile("C:\\Users\\test\\image.png")).toBe("image");
    });

    it("handles all video extensions", () => {
        for (const ext of VIDEO_EXTENSIONS) {
            expect(classifyFile(`file${ext}`)).toBe("video");
        }
    });

    it("handles all image extensions", () => {
        for (const ext of IMAGE_EXTENSIONS) {
            expect(classifyFile(`file${ext}`)).toBe("image");
        }
    });

    it("returns null for empty string", () => {
        expect(classifyFile("")).toBeNull();
    });
});
