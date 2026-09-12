import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { ConversionFailedError } from "./errors/OfficeToPdfError.js";
import { resolveBinaryPath } from "./internal/binary.js";
import { buildArgs, fontExtension } from "./internal/cli-args.js";
import { createFormatShortcuts } from "./internal/convenience.js";
import { resolveFormat, toBytes } from "./internal/shared.js";
import type { Converter, ConverterOptions, ConvertInput, ConvertOptions } from "./types.js";

const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT_MS = 120_000;

function reportWarnings(stderr: string, onWarning: ConvertOptions["onWarning"]) {
  if (!onWarning) return;
  for (const line of stderr.split("\n")) {
    const message = line.trim();
    if (message) onWarning({ message });
  }
}

class NodeConverter implements Converter {
  private readonly binaryPath: string;
  private readonly timeoutMs: number;
  private fontDir?: Promise<string | undefined>;

  constructor(private readonly options: ConverterOptions = {}) {
    this.binaryPath = resolveBinaryPath(options.binaryPath);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async convert(input: ConvertInput, options: ConvertOptions = {}): Promise<Uint8Array> {
    const format = resolveFormat(input, options);
    const bytes = await toBytes(input);
    const fontPaths = await this.resolveFontPaths();

    const workDir = await mkdtemp(join(tmpdir(), "office2pdf-"));
    try {
      const inputPath = join(workDir, `input.${format}`);
      const outputPath = join(workDir, "output.pdf");
      await writeFile(inputPath, bytes);

      const { stderr } = await execFileAsync(
        this.binaryPath,
        buildArgs(inputPath, outputPath, fontPaths, options),
        { timeout: this.timeoutMs, signal: options.signal, windowsHide: true },
      ).catch((cause: NodeJS.ErrnoException & { stderr?: string }) => {
        throw new ConversionFailedError(
          `Converting ${format} to PDF failed`,
          cause.stderr?.trim() || cause.message,
        );
      });

      reportWarnings(stderr, options.onWarning);

      return await readFile(outputPath);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  async dispose(): Promise<void> {
    const dir = await this.fontDir;
    this.fontDir = undefined;
    if (dir) await rm(dir, { recursive: true, force: true });
  }

  private async resolveFontPaths(): Promise<readonly string[]> {
    const configured = this.options.fontPaths ?? [];
    const registered = await this.materializeFonts();
    return registered ? [...configured, registered] : configured;
  }

  private materializeFonts(): Promise<string | undefined> {
    this.fontDir ??= (async () => {
      const fonts = this.options.fonts ?? [];
      if (fonts.length === 0) return undefined;

      const dir = await mkdtemp(join(tmpdir(), "office2pdf-fonts-"));
      await Promise.all(
        fonts.map(async (font, index) => {
          const bytes = await toBytes(font);
          return writeFile(join(dir, `font-${index}.${fontExtension(bytes)}`), bytes);
        }),
      );
      return dir;
    })();
    return this.fontDir;
  }
}

export function createConverter(options?: ConverterOptions): Converter {
  return new NodeConverter(options);
}

export async function convert(input: ConvertInput, options?: ConvertOptions): Promise<Uint8Array> {
  const converter = new NodeConverter();
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
