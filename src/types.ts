export type OfficeFormat = "docx" | "pptx" | "xlsx";

export type PaperSize = "a4" | "letter" | "legal";

export type ConvertInput = Uint8Array | ArrayBuffer | Blob;

export interface ConversionWarning {
  message: string;
  kind?: string;
  format?: string;
  from?: string;
  to?: string;
  element?: string;
  detail?: string;
  reason?: string;
}

export interface ConvertOptions {
  format?: OfficeFormat;
  paperSize?: PaperSize;
  landscape?: boolean;
  pdfA?: boolean;
  tagged?: boolean;
  pdfUa?: boolean;
  sheets?: string[];
  slides?: string;
  signal?: AbortSignal;
  onWarning?: (warning: ConversionWarning) => void;
}

export interface ConverterOptions {
  fonts?: ConvertInput[];
  fontPaths?: string[];
  binaryPath?: string;
  timeoutMs?: number;
}

export interface Converter {
  convert(input: ConvertInput, options?: ConvertOptions): Promise<Uint8Array>;
  dispose(): Promise<void>;
}
