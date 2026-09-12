import { beforeAll, describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { ConversionFailedError, convert, createConverter, docxToPdf } from "../src/index.js";
import { resolveBinaryPath } from "../src/internal/binary.js";

function binaryAvailable(): boolean {
  try {
    resolveBinaryPath();
    return true;
  } catch {
    return false;
  }
}

const isPdf = (bytes: Uint8Array) => new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";

let docx: Uint8Array;

beforeAll(async () => {
  docx = await Bun.file(new URL("./fixtures/sample.docx", import.meta.url)).bytes();
});

describe.skipIf(!binaryAvailable())("node conversion", () => {
  test("converts a DOCX to a PDF", async () => {
    const pdf = await convert(docx, { format: "docx" });
    expect(isPdf(pdf)).toBe(true);
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });

  test("accepts an ArrayBuffer", async () => {
    expect(isPdf(await convert(docx.slice().buffer, { format: "docx" }))).toBe(true);
  });

  test("accepts a Blob", async () => {
    expect(isPdf(await convert(new Blob([docx]), { format: "docx" }))).toBe(true);
  });

  test("infers the format from a File name", async () => {
    expect(isPdf(await convert(new File([docx], "sample.docx")))).toBe(true);
  });

  test("docxToPdf needs no options", async () => {
    expect(isPdf(await docxToPdf(docx))).toBe(true);
  });

  test("tagged output embeds a structure tree", async () => {
    const plain = new TextDecoder("latin1").decode(await convert(docx, { format: "docx" }));
    const tagged = new TextDecoder("latin1").decode(
      await convert(docx, { format: "docx", tagged: true }),
    );
    expect(plain).not.toContain("StructTreeRoot");
    expect(tagged).toContain("StructTreeRoot");
  });

  test("landscape changes the page geometry", async () => {
    const portrait = await convert(docx, { format: "docx" });
    const landscape = await convert(docx, { format: "docx", landscape: true });
    expect(landscape).not.toEqual(portrait);
  });

  test("rejects bytes that are not an Office document", async () => {
    const attempt = convert(new Uint8Array([1, 2, 3, 4]), { format: "docx" });
    await expect(attempt).rejects.toThrow(ConversionFailedError);
  });

  test("surfaces the converter's own message on failure", async () => {
    const error = await convert(new Uint8Array([1, 2, 3, 4]), { format: "docx" }).catch((e) => e);
    expect(error).toBeInstanceOf(ConversionFailedError);
    expect(error.detail).toBeTruthy();
  });

  test("honors an AbortSignal", async () => {
    const attempt = convert(docx, { format: "docx", signal: AbortSignal.abort() });
    await expect(attempt).rejects.toThrow(ConversionFailedError);
  });

  test("reuses a converter across conversions", async () => {
    const converter = createConverter();
    try {
      const [first, second] = await Promise.all([
        converter.convert(docx, { format: "docx" }),
        converter.convert(docx, { format: "docx" }),
      ]);
      expect(isPdf(first)).toBe(true);
      expect(isPdf(second)).toBe(true);
    } finally {
      await converter.dispose();
    }
  });

  test("registers caller-supplied font bytes", async () => {
    const converter = createConverter({ fonts: [new Uint8Array([0, 1, 0, 0])] });
    try {
      expect(isPdf(await converter.convert(docx, { format: "docx" }))).toBe(true);
    } finally {
      await converter.dispose();
    }
  });

  test("leaves no temporary directories behind", async () => {
    const before = (await readdir(tmpdir())).filter((e) => e.startsWith("office2pdf-")).length;
    await convert(docx, { format: "docx" });
    await convert(new Uint8Array([1, 2, 3, 4]), { format: "docx" }).catch(() => undefined);
    const after = (await readdir(tmpdir())).filter((e) => e.startsWith("office2pdf-")).length;
    expect(after).toBe(before);
  });

  test("dispose removes the converter's font directory", async () => {
    const converter = createConverter({ fonts: [new Uint8Array([0, 1, 0, 0])] });
    await converter.convert(docx, { format: "docx" });
    await converter.dispose();
    const leftovers = (await readdir(tmpdir())).filter((e) => e.startsWith("office2pdf-fonts-"));
    expect(leftovers).toHaveLength(0);
  });
});
