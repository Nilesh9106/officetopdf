# officetopdf-js

Convert **DOCX**, **PPTX** and **XLSX** to PDF from JavaScript — in Node.js, Bun, Deno, Electron, and directly in the browser.

No LibreOffice. No Chromium. No Docker. No upload.

Conversion is powered by [`office2pdf`](https://github.com/developer0hye/office2pdf), a pure-Rust converter built on [Typst](https://github.com/typst/typst). This package is the TypeScript distribution and API layer around it: the native binary on the server, the WebAssembly build in the browser, one API for both.

## Install

```bash
bun add officetopdf-js
```

Only the binary for your platform is downloaded, via optional dependencies (the same pattern as `esbuild` and `swc`).

| Platform | Package |
|----------|---------|
| macOS Apple Silicon | `officetopdf-darwin-arm64` |
| macOS Intel | `officetopdf-darwin-x64` |
| Linux x64 (glibc) | `officetopdf-linux-x64` |
| Linux x64 (musl) | `officetopdf-linux-x64-musl` |
| Linux ARM64 | `officetopdf-linux-arm64` |
| Windows x64 | `officetopdf-windows-x64` |

Converting in the browser needs one extra package, so server-only installs never pay for it:

```bash
bun add officetopdf-wasm
```

## Usage

```ts
import { convert } from "officetopdf-js";

const pdf = await convert(await Bun.file("report.docx").bytes(), { format: "docx" });

await Bun.write("report.pdf", pdf);
```

Input may be a `Uint8Array`, `ArrayBuffer`, or `Blob`/`File`. Output is always a `Uint8Array`.

### Browser

```ts
import { convert } from "officetopdf-js/browser";

const pdf = await convert(file);

const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
```

The WebAssembly module lives in the separate `officetopdf-wasm` package above and is loaded lazily on the first conversion, so it never lands in your initial bundle. It is roughly 47 MB uncompressed (about 20 MB over the wire): that is Typst plus its fallback fonts, and it is the price of converting without a server. Run conversions in a Web Worker so the download and the rendering stay off your main thread. Bundlers (Vite, Next.js, webpack, Rollup, esbuild) pick the browser build automatically through the `browser` export condition; `officetopdf-js/browser` and `officetopdf-js/node` select one explicitly.

The `format` is inferred from `File.name` when present, and can always be passed explicitly.

### Shortcuts

```ts
import { docxToPdf, pptxToPdf, xlsxToPdf } from "officetopdf-js";

const pdf = await docxToPdf(bytes);
```

### Reusable converter

Fonts are parsed once per converter instead of once per conversion.

```ts
import { createConverter } from "officetopdf-js";

const converter = createConverter({
  fonts: [await Bun.file("fonts/Pretendard.ttf").bytes()],
  fontPaths: ["/usr/share/fonts"],
});

const pdf = await converter.convert(bytes, { format: "docx", pdfA: true });

await converter.dispose();
```

## Options

### `ConvertOptions`

| Option | Type | Description |
|--------|------|-------------|
| `format` | `"docx" \| "pptx" \| "xlsx"` | Input format. Inferred from `File.name` when omitted. |
| `paperSize` | `"a4" \| "letter" \| "legal"` | Paper size override. |
| `landscape` | `boolean` | Force landscape orientation. |
| `pdfA` | `boolean` | Produce PDF/A-2b archival output. |
| `tagged` | `boolean` | Tag document structure so screen readers can navigate it. Node only. |
| `pdfUa` | `boolean` | Produce PDF/UA-1 accessible output; implies `tagged`. Node only. |

`pdfUa` enforces the full PDF/UA-1 standard and fails the conversion when the source cannot satisfy it — a document with no title raises `ConversionFailedError: PDF/UA-1 error: missing document title`. Use `tagged` when you want screen-reader structure without the strict compliance gate.
| `sheets` | `string[]` | XLSX sheet filter; the only way to print a hidden sheet. |
| `slides` | `string` | PPTX slide range, e.g. `"1-5"`. |
| `signal` | `AbortSignal` | Cancel an in-flight conversion. |
| `onWarning` | `(warning: ConversionWarning) => void` | Non-fatal diagnostics, e.g. a missing font falling back. |

### `ConverterOptions`

| Option | Type | Description |
|--------|------|-------------|
| `fonts` | `(Uint8Array \| ArrayBuffer \| Blob)[]` | TTF/OTF/TTC faces to register. |
| `fontPaths` | `string[]` | Additional font directories. Node only. |
| `lastResortFontFamily` | `string` | Final fallback family. Browser only. |
| `binaryPath` | `string` | Use a specific `office2pdf` binary. Node only. |
| `timeoutMs` | `number` | Conversion timeout, default `120000`. Node only. |

Set `OFFICE2PDF_BINARY` to point every conversion at a binary of your choosing.

## Warnings

A conversion can succeed while silently substituting a missing font. Opt in to hear about it:

```ts
const pdf = await convert(bytes, {
  format: "docx",
  onWarning: ({ kind, from, to, message }) => console.warn(kind, from, to, message),
});
```

The browser build reports structured warnings from the WebAssembly module; the Node build forwards the CLI's diagnostics as `message`.

## Errors

All failures are instances of `OfficeToPdfError`: `ConversionFailedError` (conversion or CLI failure, with upstream stderr in `detail`) and `UnsupportedPlatformError` (no binary for the current platform).

## Notes

- CJK text in the browser needs a font: register one through `fonts`, or build the WASM bundle with the upstream `wasm-cjk-font` feature (adds 3.3 MB).
- Large documents block the thread they run on. In the browser, run conversions in a Web Worker.
- Word's "Don't add space between paragraphs of the same style" (`w:contextualSpacing`) is currently ignored by the converter, so list-heavy DOCX files render with more vertical space than Word shows ([upstream #1684](https://github.com/developer0hye/office2pdf/issues/1684)).

## Development

```bash
bun install
bun run ci:check
```

`bun test` runs the unit suite anywhere. The end-to-end suites under `tests/` skip themselves unless their runtime is present, so nothing fails on a bare checkout.

Testing the Node path locally needs an `office2pdf` binary — point `OFFICE2PDF_BINARY` at one, or run `bun run binaries:fetch`. Testing the browser path needs Rust and `wasm-pack` (`brew install rustup wasm-pack`), then:

```bash
bun run wasm:build
cd npm/wasm && bun link && cd ../.. && bun link officetopdf-wasm
```

`bun run wasm:build` compiles the upstream WebAssembly bundle into `npm/wasm/`, and `bun run binaries:fetch` stages the per-platform binary packages into `npm/`. Both track the latest upstream release by default; set `OFFICE2PDF_VERSION=v0.6.8` to pin one. Both run in CI on release.

## License

Apache-2.0, matching the bundled [`office2pdf`](https://github.com/developer0hye/office2pdf) binaries and WebAssembly module, © their respective authors.
