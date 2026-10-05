// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildZip } from "./zip.js";

const bytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());
const text = (name: string, body: string) => ({ name, blob: new Blob([body]) });

describe("buildZip", () => {
  it("writes just an end-of-central-directory record for an empty archive", async () => {
    const zip = await bytes(await buildZip([]));
    const view = new DataView(zip.buffer);
    expect(zip.length).toBe(22);
    expect(view.getUint32(0, true)).toBe(0x06054b50);
    expect(view.getUint16(10, true)).toBe(0);
  });

  it("stores each file uncompressed with a correct CRC-32 and directory", async () => {
    const blob = await buildZip([text("a.txt", "hello"), text("dir\\b.txt", "world!")]);
    expect(blob.type).toBe("application/zip");

    const zip = await bytes(blob);
    const view = new DataView(zip.buffer);
    const decode = (start: number, len: number) => new TextDecoder().decode(zip.slice(start, start + len));

    // End of central directory
    const eocd = zip.length - 22;
    expect(view.getUint32(eocd, true)).toBe(0x06054b50);
    expect(view.getUint16(eocd + 10, true)).toBe(2);
    const centralOffset = view.getUint32(eocd + 16, true);
    expect(centralOffset + view.getUint32(eocd + 12, true)).toBe(eocd);

    // First central entry → "a.txt" / "hello"
    expect(view.getUint32(centralOffset, true)).toBe(0x02014b50);
    expect(view.getUint32(centralOffset + 16, true)).toBe(0x3610a686); // CRC-32("hello")
    expect(view.getUint32(centralOffset + 20, true)).toBe(5);
    const nameLen = view.getUint16(centralOffset + 28, true);
    expect(decode(centralOffset + 46, nameLen)).toBe("a.txt");

    const localOffset = view.getUint32(centralOffset + 42, true);
    expect(localOffset).toBe(0);
    expect(view.getUint32(localOffset, true)).toBe(0x04034b50);
    expect(decode(localOffset + 30 + nameLen, 5)).toBe("hello");

    // Second entry: backslashes become forward slashes and its offset skips the first file
    const second = centralOffset + 46 + nameLen;
    const secondNameLen = view.getUint16(second + 28, true);
    expect(decode(second + 46, secondNameLen)).toBe("dir/b.txt");
    expect(view.getUint32(second + 42, true)).toBe(30 + nameLen + 5);
  });
});
