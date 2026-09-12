export class OfficeToPdfError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OfficeToPdfError";
  }
}

export class UnsupportedPlatformError extends OfficeToPdfError {
  constructor(platform: string, arch: string, options?: ErrorOptions) {
    super(
      `No office2pdf binary is available for ${platform}-${arch}. ` +
        "Install the matching platform package, or set OFFICE2PDF_BINARY to a local binary.",
      options,
    );
    this.name = "UnsupportedPlatformError";
  }
}

export class ConversionFailedError extends OfficeToPdfError {
  constructor(
    message: string,
    readonly detail?: string,
  ) {
    super(detail ? `${message}: ${detail}` : message);
    this.name = "ConversionFailedError";
  }
}
