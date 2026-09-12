import type { ConvertOptions } from "../types.js";

export function buildArgs(
  inputPath: string,
  outputPath: string,
  fontPaths: readonly string[],
  options: ConvertOptions,
): string[] {
  const args = [inputPath, "--output", outputPath];

  if (options.paperSize) args.push("--paper", options.paperSize);
  if (options.landscape) args.push("--landscape");
  if (options.pdfA) args.push("--pdf-a");
  if (options.tagged) args.push("--tagged");
  if (options.pdfUa) args.push("--pdf-ua");
  if (options.sheets?.length) args.push("--sheets", options.sheets.join(","));
  if (options.slides) args.push("--slides", options.slides);
  for (const fontPath of fontPaths) args.push("--font-path", fontPath);

  return args;
}

export function fontExtension(bytes: Uint8Array): string {
  const magic = String.fromCharCode(...bytes.subarray(0, 4));
  if (magic === "ttcf") return "ttc";
  if (magic === "OTTO") return "otf";
  return "ttf";
}
