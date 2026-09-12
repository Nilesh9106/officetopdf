import type { ConvertInput, ConvertOptions, OfficeFormat } from "../types.js";

export type FormatOptions = Omit<ConvertOptions, "format">;

export type FormatShortcut = (input: ConvertInput, options?: FormatOptions) => Promise<Uint8Array>;

type Convert = (input: ConvertInput, options?: ConvertOptions) => Promise<Uint8Array>;

function shortcut(convert: Convert, format: OfficeFormat): FormatShortcut {
  return (input, options) => convert(input, { ...options, format });
}

export function createFormatShortcuts(convert: Convert) {
  return {
    docxToPdf: shortcut(convert, "docx"),
    pptxToPdf: shortcut(convert, "pptx"),
    xlsxToPdf: shortcut(convert, "xlsx"),
  };
}
