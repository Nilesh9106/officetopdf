declare module "officetopdf-wasm" {
  export class ConversionWarning {
    readonly kind: string;
    readonly format: string;
    readonly message: string;
    readonly from: string | undefined;
    readonly to: string | undefined;
    readonly element: string | undefined;
    readonly detail: string | undefined;
    readonly reason: string | undefined;
    free(): void;
  }

  export class ConversionResult {
    readonly pdf: Uint8Array;
    readonly warningCount: number;
    warningAt(index: number): ConversionWarning | undefined;
    free(): void;
  }

  export class Office2PdfConverter {
    registerFont(data: Uint8Array): void;
    clearFonts(): void;
    setLastResortFontFamily(family: string): void;
    clearLastResortFontFamily(): void;
    convertToPdf(data: Uint8Array, format: string): ConversionResult;
    convertDocxToPdf(data: Uint8Array): ConversionResult;
    convertPptxToPdf(data: Uint8Array): ConversionResult;
    convertXlsxToPdf(data: Uint8Array): ConversionResult;
    free(): void;
  }

  export function convertToPdf(data: Uint8Array, format: string): Uint8Array;
  export function convertToPdfWithResult(data: Uint8Array, format: string): ConversionResult;

  export default function init(input?: unknown): Promise<unknown>;
}
