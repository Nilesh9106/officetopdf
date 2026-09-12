import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";
import { UnsupportedPlatformError } from "../errors/OfficeToPdfError.js";

const require = createRequire(import.meta.url);

const PLATFORM_PACKAGES: Record<string, string> = {
  "darwin-arm64": "officetopdf-darwin-arm64",
  "darwin-x64": "officetopdf-darwin-x64",
  "linux-arm64": "officetopdf-linux-arm64",
  "linux-x64": "officetopdf-linux-x64",
  "linux-x64-musl": "officetopdf-linux-x64-musl",
  "win32-x64": "officetopdf-windows-x64",
};

function isMusl(): boolean {
  const report = process.report?.getReport();
  if (typeof report === "object" && report !== null && "header" in report) {
    const header = (report as { header?: { glibcVersionRuntime?: string } }).header;
    return !header?.glibcVersionRuntime;
  }
  return false;
}

function currentTarget(): string {
  const target = `${process.platform}-${process.arch}`;
  return target === "linux-x64" && isMusl() ? "linux-x64-musl" : target;
}

let cached: string | undefined;

export function resolveBinaryPath(override?: string): string {
  const explicit = override ?? process.env.OFFICE2PDF_BINARY;
  if (explicit) return explicit;
  if (cached) return cached;

  const target = currentTarget();
  const packageName = PLATFORM_PACKAGES[target];
  if (!packageName) throw new UnsupportedPlatformError(process.platform, process.arch);

  const executable = process.platform === "win32" ? "office2pdf.exe" : "office2pdf";
  try {
    cached = join(dirname(require.resolve(`${packageName}/package.json`)), executable);
  } catch (cause) {
    throw new UnsupportedPlatformError(process.platform, process.arch, { cause });
  }
  return cached;
}
