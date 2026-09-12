import { afterEach, describe, expect, test } from "bun:test";
import { UnsupportedPlatformError } from "../errors/OfficeToPdfError.js";
import { resolveBinaryPath } from "../internal/binary.js";

const originalEnv = process.env.OFFICE2PDF_BINARY;

function platformPackageInstalled(): boolean {
  delete process.env.OFFICE2PDF_BINARY;
  try {
    resolveBinaryPath();
    return true;
  } catch {
    return false;
  } finally {
    restoreEnv();
  }
}

function restoreEnv() {
  if (originalEnv === undefined) delete process.env.OFFICE2PDF_BINARY;
  else process.env.OFFICE2PDF_BINARY = originalEnv;
}

const bundled = platformPackageInstalled();

afterEach(restoreEnv);

describe("resolveBinaryPath", () => {
  test("prefers an explicit override", () => {
    process.env.OFFICE2PDF_BINARY = "/from/env";
    expect(resolveBinaryPath("/explicit")).toBe("/explicit");
  });

  test("falls back to OFFICE2PDF_BINARY", () => {
    process.env.OFFICE2PDF_BINARY = "/from/env";
    expect(resolveBinaryPath()).toBe("/from/env");
  });

  test.skipIf(bundled)("ignores an empty OFFICE2PDF_BINARY", () => {
    process.env.OFFICE2PDF_BINARY = "";
    expect(() => resolveBinaryPath()).toThrow(UnsupportedPlatformError);
  });

  test.skipIf(bundled)("names the platform when no binary is installed", () => {
    delete process.env.OFFICE2PDF_BINARY;
    expect(() => resolveBinaryPath()).toThrow(`${process.platform}-${process.arch}`);
  });

  test.skipIf(!bundled)("resolves the bundled platform binary", () => {
    delete process.env.OFFICE2PDF_BINARY;
    expect(resolveBinaryPath()).toContain("office2pdf");
  });
});
