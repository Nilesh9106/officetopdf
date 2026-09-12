import { ConversionFailedError, OfficeToPdfError } from "./errors/OfficeToPdfError.js";
import { createFormatShortcuts } from "./internal/convenience.js";
import { resolveFormat, toBytes } from "./internal/shared.js";
import type {
  ConversionWarning,
  Converter,
  ConverterOptions,
  ConvertInput,
  ConvertOptions,
} from "./types.js";

type WasmModule = typeof import("officetopdf-wasm");
type ConversionResult = InstanceType<WasmModule["ConversionResult"]>;
type WasmWarning = InstanceType<WasmModule["ConversionWarning"]>;
type WasmConverter = InstanceType<WasmModule["Office2PdfConverter"]>;

let wasmModule: Promise<WasmModule> | undefined;

async function loadWasm(): Promise<WasmModule> {
  wasmModule ??= import("officetopdf-wasm")
    .then(async (module) => {
      await module.default();
      return module;
    })
    .catch((cause) => {
      wasmModule = undefined;
      throw new OfficeToPdfError(
        "Failed to load the office2pdf WebAssembly module. Install the optional " +
          "`officetopdf-wasm` package to convert in the browser.",
        { cause },
      );
    });
  return wasmModule;
}

function toWarning(warning: WasmWarning): ConversionWarning {
  const { kind, format, message, from, to, element, detail, reason } = warning;
  warning.free();
  return { kind, format, message, from, to, element, detail, reason };
}

function reportWarnings(result: ConversionResult, onWarning: ConvertOptions["onWarning"]) {
  for (let index = 0; index < result.warningCount; index += 1) {
    const warning = result.warningAt(index);
    if (warning) onWarning?.(toWarning(warning));
  }
}

class BrowserConverter implements Converter {
  private instance?: Promise<WasmConverter>;

  constructor(private readonly options: ConverterOptions = {}) {}

  async convert(input: ConvertInput, options: ConvertOptions = {}): Promise<Uint8Array> {
    const format = resolveFormat(input, options);
    const bytes = await toBytes(input);
    const converter = await this.getInstance();

    try {
      const result = converter.convertToPdf(bytes, format);
      try {
        reportWarnings(result, options.onWarning);
        return result.pdf;
      } finally {
        result.free();
      }
    } catch (cause) {
      throw new ConversionFailedError(
        `Converting ${format} to PDF failed`,
        cause instanceof Error ? cause.message : String(cause),
      );
    }
  }

  async dispose(): Promise<void> {
    const instance = this.instance;
    this.instance = undefined;
    (await instance)?.free();
  }

  private getInstance(): Promise<WasmConverter> {
    this.instance ??= (async () => {
      const { Office2PdfConverter } = await loadWasm();
      const converter = new Office2PdfConverter();

      for (const font of this.options.fonts ?? []) converter.registerFont(await toBytes(font));
      if (this.options.lastResortFontFamily) {
        converter.setLastResortFontFamily(this.options.lastResortFontFamily);
      }
      return converter;
    })();
    return this.instance;
  }
}

export function createConverter(options?: ConverterOptions): Converter {
  return new BrowserConverter(options);
}

export async function convert(input: ConvertInput, options?: ConvertOptions): Promise<Uint8Array> {
  const converter = new BrowserConverter();
  try {
    return await converter.convert(input, options);
  } finally {
    await converter.dispose();
  }
}

export const { docxToPdf, pptxToPdf, xlsxToPdf } = createFormatShortcuts(convert);

export {
  ConversionFailedError,
  OfficeToPdfError,
  UnsupportedPlatformError,
} from "./errors/OfficeToPdfError.js";
export type { FormatOptions, FormatShortcut } from "./internal/convenience.js";
export type {
  ConversionWarning,
  Converter,
  ConverterOptions,
  ConvertInput,
  ConvertOptions,
  OfficeFormat,
  PaperSize,
} from "./types.js";
