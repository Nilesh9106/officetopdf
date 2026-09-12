import { beforeAll, describe, expect, test } from "bun:test";
import { ConversionFailedError, convert, createConverter, docxToPdf } from "../src/browser.js";

function wasmAvailable(): boolean {
  try {
    import.meta.resolve("officetopdf-wasm");
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

describe.skipIf(!wasmAvailable())("browser conversion", () => {
  test("converts a DOCX to a PDF", async () => {
    const pdf = await convert(docx, { format: "docx" });
    expect(isPdf(pdf)).toBe(true);
    expect(pdf.byteLength).toBeGreaterThan(1000);
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

  test("rejects bytes that are not an Office document", async () => {
    const attempt = convert(new Uint8Array([1, 2, 3, 4]), { format: "docx" });
    await expect(attempt).rejects.toThrow(ConversionFailedError);
  });

  test("initializes the module only once across converters", async () => {
    const [first, second] = await Promise.all([
      convert(docx, { format: "docx" }),
      convert(docx, { format: "docx" }),
    ]);
    expect(first).toEqual(second);
  });

  test("reuses a converter across conversions", async () => {
    const converter = createConverter();
    try {
      expect(isPdf(await converter.convert(docx, { format: "docx" }))).toBe(true);
      expect(isPdf(await converter.convert(docx, { format: "docx" }))).toBe(true);
    } finally {
      await converter.dispose();
    }
  });

  test("dispose is safe to call twice", async () => {
    const converter = createConverter();
    await converter.convert(docx, { format: "docx" });
    await converter.dispose();
    await expect(converter.dispose()).resolves.toBeUndefined();
  });

  test("reports warnings as plain objects that survive the conversion", async () => {
    const warnings: unknown[] = [];
    await convert(docx, { format: "docx", onWarning: (warning) => warnings.push(warning) });
    for (const warning of warnings) {
      expect(typeof (warning as { message: string }).message).toBe("string");
    }
  });
});
