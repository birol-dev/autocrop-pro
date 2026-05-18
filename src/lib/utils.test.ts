import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
    it("merges class names", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
        expect(cn("base", false && "hidden", "visible")).toBe("base visible");
    });

    it("merges tailwind classes correctly", () => {
        expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
    });

    it("handles empty inputs", () => {
        expect(cn()).toBe("");
    });

    it("resolves clsx truthy/falsy", () => {
        expect(cn("a", undefined, "b", null, "c")).toBe("a b c");
    });
});
