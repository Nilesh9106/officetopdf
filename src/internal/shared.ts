import { OfficeToPdfError } from "../errors/OfficeToPdfError.js";
import type { ConvertInput, ConvertOptions, OfficeFormat } from "../types.js";

const FORMATS: readonly OfficeFormat[] = ["docx", "pptx", "xlsx"];

export async function toBytes(input: ConvertInput): Promise<Uint8Array> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return new Uint8Array(await input.arrayBuffer());
  }
  throw new OfficeToPdfError("Input must be a Uint8Array, ArrayBuffer, or Blob.");
}

export function resolveFormat(input: ConvertInput, options: ConvertOptions): OfficeFormat {
  if (options.format) {
    if (!FORMATS.includes(options.format)) {
      throw new OfficeToPdfError(`Unsupported format "${options.format}".`);
    }
    return options.format;
  }

  const name = (input as { name?: unknown }).name;
  const extension = typeof name === "string" ? name.split(".").pop()?.toLowerCase() : undefined;
  const inferred = FORMATS.find((format) => format === extension);
  if (inferred) return inferred;

  throw new OfficeToPdfError(
    'Unable to infer the input format. Pass { format: "docx" | "pptx" | "xlsx" }.',
  );
}
