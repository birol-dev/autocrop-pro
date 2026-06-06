/**
 * Tests for process option logic used in the backend-facing layer:
 * format resolution, padding computation, and progress event shapes.
 *
 * These are pure-JS equivalents of the Rust logic so we can exercise
 * them in CI without a native binary.
 */

import { describe, it, expect } from "vitest";

// ── Mirrors of Rust logic ──────────────────────────────────────────────────

const VIDEO_EXTS = ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"];

function isVideo(ext: string): boolean {
    return VIDEO_EXTS.includes(ext.toLowerCase());
}

function resolveOutputFormat(inputExt: string, requestedFormat: string): string {
    const ext = inputExt.toLowerCase();
    const requested =
        requestedFormat === "Same as source" || requestedFormat === ""
            ? ext
            : requestedFormat.toLowerCase();

    if (isVideo(ext)) {
        return isVideo(requested) ? requested : ext;
    } else {
        return isVideo(requested) ? "png" : requested;
    }
}

function applyPadding(
    crop: { x: number; y: number; w: number; h: number },
    pad: number
): { x: number; y: number; w: number; h: number } {
    return {
        x: Math.max(0, crop.x - pad),
        y: Math.max(0, crop.y - pad),
        w: crop.w + pad * 2,
        h: crop.h + pad * 2,
    };
}

function clampCrop(
    crop: { x: number; y: number; w: number; h: number },
    imgW: number,
    imgH: number
): { x: number; y: number; w: number; h: number } {
    const safeX = Math.min(crop.x, imgW - 1);
    const safeY = Math.min(crop.y, imgH - 1);
    const maxW = imgW - safeX;
    const maxH = imgH - safeY;
    const finalW = crop.w === 0 ? maxW : Math.min(crop.w, maxW);
    const finalH = crop.h === 0 ? maxH : Math.min(crop.h, maxH);
    return { x: safeX, y: safeY, w: finalW, h: finalH };
}

// ── Output Format Resolution ───────────────────────────────────────────────

describe("resolveOutputFormat", () => {
    it("keeps source format when 'Same as source'", () => {
        expect(resolveOutputFormat("png", "Same as source")).toBe("png");
        expect(resolveOutputFormat("jpg", "Same as source")).toBe("jpg");
        expect(resolveOutputFormat("mp4", "Same as source")).toBe("mp4");
    });

    it("keeps source format when empty string", () => {
        expect(resolveOutputFormat("webp", "")).toBe("webp");
    });

    it("allows image-to-image format change", () => {
        expect(resolveOutputFormat("png", "jpg")).toBe("jpg");
        expect(resolveOutputFormat("jpg", "webp")).toBe("webp");
        expect(resolveOutputFormat("png", "png")).toBe("png");
    });

    it("prevents video input from being saved as image format", () => {
        expect(resolveOutputFormat("mp4", "png")).toBe("mp4");
        expect(resolveOutputFormat("mov", "jpg")).toBe("mov");
        expect(resolveOutputFormat("avi", "webp")).toBe("avi");
    });

    it("prevents image input from being saved as video format", () => {
        expect(resolveOutputFormat("png", "mp4")).toBe("png");
        expect(resolveOutputFormat("jpg", "mov")).toBe("png");
    });

    it("allows video-to-video format change (e.g. mp4 -> mov)", () => {
        expect(resolveOutputFormat("mp4", "mov")).toBe("mov");
        expect(resolveOutputFormat("avi", "webm")).toBe("webm");
    });

    it("is case-insensitive for input extension", () => {
        expect(resolveOutputFormat("PNG", "jpg")).toBe("jpg");
        expect(resolveOutputFormat("MP4", "png")).toBe("mp4");
    });
});

// ── Padding Computation ────────────────────────────────────────────────────

describe("applyPadding", () => {
    it("expands crop area by pad on all sides", () => {
        const result = applyPadding({ x: 20, y: 20, w: 60, h: 60 }, 10);
        expect(result).toEqual({ x: 10, y: 10, w: 80, h: 80 });
    });

    it("clamps x/y to 0 (no negative coordinates)", () => {
        const result = applyPadding({ x: 5, y: 3, w: 40, h: 40 }, 10);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
        expect(result.w).toBe(60);
        expect(result.h).toBe(60);
    });

    it("zero padding returns identical crop", () => {
        const crop = { x: 10, y: 10, w: 50, h: 50 };
        expect(applyPadding(crop, 0)).toEqual(crop);
    });

    it("works with crop touching top-left corner", () => {
        const result = applyPadding({ x: 0, y: 0, w: 100, h: 100 }, 10);
        expect(result).toEqual({ x: 0, y: 0, w: 120, h: 120 });
    });
});

// ── Crop Clamping ─────────────────────────────────────────────────────────

describe("clampCrop", () => {
    it("returns crop unchanged when fully within bounds", () => {
        expect(clampCrop({ x: 10, y: 10, w: 30, h: 30 }, 100, 100)).toEqual({
            x: 10, y: 10, w: 30, h: 30,
        });
    });

    it("clamps x to imgW-1 when out of bounds", () => {
        const result = clampCrop({ x: 200, y: 0, w: 50, h: 50 }, 100, 100);
        expect(result.x).toBe(99);
        expect(result.w).toBe(1); // max_w = 100 - 99 = 1, min(50,1) = 1
    });

    it("uses max available width when w=0", () => {
        const result = clampCrop({ x: 20, y: 20, w: 0, h: 0 }, 100, 100);
        expect(result.w).toBe(80);
        expect(result.h).toBe(80);
    });

    it("clamps w/h when crop extends beyond image bounds", () => {
        const result = clampCrop({ x: 50, y: 50, w: 200, h: 200 }, 100, 100);
        expect(result.w).toBe(50); // max_w = 100-50 = 50
        expect(result.h).toBe(50);
    });

    it("handles 1x1 image", () => {
        const result = clampCrop({ x: 0, y: 0, w: 1, h: 1 }, 1, 1);
        expect(result).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    });

    it("handles crop starting at last pixel", () => {
        // x = imgW - 1, w = 0 -> max_w = 1
        const result = clampCrop({ x: 99, y: 99, w: 0, h: 0 }, 100, 100);
        expect(result.x).toBe(99);
        expect(result.y).toBe(99);
        expect(result.w).toBe(1);
        expect(result.h).toBe(1);
    });
});

// ── isVideo helper ────────────────────────────────────────────────────────

describe("isVideo", () => {
    it("returns true for all video extensions", () => {
        for (const ext of VIDEO_EXTS) {
            expect(isVideo(ext)).toBe(true);
        }
    });

    it("returns false for image extensions", () => {
        expect(isVideo("png")).toBe(false);
        expect(isVideo("jpg")).toBe(false);
        expect(isVideo("webp")).toBe(false);
        expect(isVideo("gif")).toBe(false);
        expect(isVideo("bmp")).toBe(false);
    });

    it("returns false for empty string", () => {
        expect(isVideo("")).toBe(false);
    });

    it("is case-insensitive", () => {
        expect(isVideo("MP4")).toBe(true);
        expect(isVideo("MOV")).toBe(true);
    });
});
