import { describe, expect, test } from "bun:test";
import { createFormatShortcuts } from "../internal/convenience.js";
import type { ConvertOptions } from "../types.js";

describe("createFormatShortcuts", () => {
  const calls: ConvertOptions[] = [];
  const shortcuts = createFormatShortcuts(async (_input, options = {}) => {
    calls.push(options);
    return new Uint8Array();
  });

  test("docxToPdf pins the docx format", async () => {
    await shortcuts.docxToPdf(new Uint8Array());
    expect(calls.at(-1)?.format).toBe("docx");
  });

  test("pptxToPdf pins the pptx format", async () => {
    await shortcuts.pptxToPdf(new Uint8Array());
    expect(calls.at(-1)?.format).toBe("pptx");
  });

  test("xlsxToPdf pins the xlsx format", async () => {
    await shortcuts.xlsxToPdf(new Uint8Array());
    expect(calls.at(-1)?.format).toBe("xlsx");
  });

  test("forwards the caller's other options", async () => {
    await shortcuts.docxToPdf(new Uint8Array(), { landscape: true, paperSize: "a4" });
    expect(calls.at(-1)).toEqual({ landscape: true, paperSize: "a4", format: "docx" });
  });

  test("does not let the caller override the pinned format", async () => {
    await shortcuts.xlsxToPdf(new Uint8Array(), { format: "docx" } as ConvertOptions);
    expect(calls.at(-1)?.format).toBe("xlsx");
  });
});
