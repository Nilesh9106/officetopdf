import { describe, expect, test } from "bun:test";
import { buildArgs, fontExtension } from "../internal/cli-args.js";
import type { ConvertOptions } from "../types.js";

describe("buildArgs", () => {
  const args = (options: ConvertOptions = {}, fontPaths: string[] = []) =>
    buildArgs("in.docx", "out.pdf", fontPaths, options);

  test("always passes the input and output paths", () => {
    expect(args()).toEqual(["in.docx", "--output", "out.pdf"]);
  });

  test("omits every flag that was not requested", () => {
    expect(args({ landscape: false, pdfA: false, sheets: [], slides: "" })).toEqual([
      "in.docx",
      "--output",
      "out.pdf",
    ]);
  });

  test("maps each option to its CLI flag", () => {
    expect(
      args({
        paperSize: "letter",
        landscape: true,
        pdfA: true,
        tagged: true,
        pdfUa: true,
        sheets: ["Sheet1", "Summary"],
        slides: "1-5",
      }),
    ).toEqual([
      "in.docx",
      "--output",
      "out.pdf",
      "--paper",
      "letter",
      "--landscape",
      "--pdf-a",
      "--tagged",
      "--pdf-ua",
      "--sheets",
      "Sheet1,Summary",
      "--slides",
      "1-5",
    ]);
  });

  test("repeats --font-path once per directory", () => {
    expect(args({}, ["/a", "/b"])).toEqual([
      "in.docx",
      "--output",
      "out.pdf",
      "--font-path",
      "/a",
      "--font-path",
      "/b",
    ]);
  });

  test("keeps every flag value directly after its flag", () => {
    const result = args({ slides: "1-5", paperSize: "a4" });
    expect(result[result.indexOf("--slides") + 1]).toBe("1-5");
    expect(result[result.indexOf("--paper") + 1]).toBe("a4");
  });
});

describe("fontExtension", () => {
  const magic = (tag: string) =>
    new Uint8Array([...tag].map((character) => character.charCodeAt(0)));

  test("detects a TrueType collection", () => {
    expect(fontExtension(magic("ttcf"))).toBe("ttc");
  });

  test("detects OpenType CFF outlines", () => {
    expect(fontExtension(magic("OTTO"))).toBe("otf");
  });

  test("falls back to ttf for anything else", () => {
    expect(fontExtension(new Uint8Array([0, 1, 0, 0]))).toBe("ttf");
  });

  test("falls back to ttf for bytes shorter than the magic", () => {
    expect(fontExtension(new Uint8Array([0]))).toBe("ttf");
  });
});
