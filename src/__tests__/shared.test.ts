import { describe, expect, test } from "bun:test";
import { OfficeToPdfError } from "../errors/OfficeToPdfError.js";
import { resolveFormat, toBytes } from "../internal/shared.js";

describe("toBytes", () => {
  test("passes through a Uint8Array", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(await toBytes(bytes)).toBe(bytes);
  });

  test("converts an ArrayBuffer", async () => {
    expect(await toBytes(new Uint8Array([1, 2]).buffer)).toEqual(new Uint8Array([1, 2]));
  });

  test("converts a Blob", async () => {
    expect(await toBytes(new Blob([new Uint8Array([7])]))).toEqual(new Uint8Array([7]));
  });

  test("rejects unsupported input", () => {
    expect(toBytes("nope" as never)).rejects.toThrow(OfficeToPdfError);
  });
});

describe("resolveFormat", () => {
  const bytes = new Uint8Array();

  test("prefers the explicit format", () => {
    expect(resolveFormat(bytes, { format: "pptx" })).toBe("pptx");
  });

  test("infers the format from a File name", () => {
    const file = new File([bytes], "Report.DOCX");
    expect(resolveFormat(file, {})).toBe("docx");
  });

  test("throws when the format cannot be inferred", () => {
    expect(() => resolveFormat(bytes, {})).toThrow(OfficeToPdfError);
  });

  test("rejects an unknown format", () => {
    expect(() => resolveFormat(bytes, { format: "pdf" as never })).toThrow(OfficeToPdfError);
  });
});
