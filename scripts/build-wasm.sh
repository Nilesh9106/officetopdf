#!/usr/bin/env bash
set -euo pipefail

VERSION="$(bun scripts/upstream-version.ts)"
FEATURES="${OFFICE2PDF_WASM_FEATURES:-wasm}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

git clone --depth 1 --branch "$VERSION" https://github.com/developer0hye/office2pdf "$WORKDIR/office2pdf"
wasm-pack build "$WORKDIR/office2pdf/crates/office2pdf" --target web --features "$FEATURES" --locked

mkdir -p npm/wasm
cp "$WORKDIR/office2pdf/crates/office2pdf/pkg/office2pdf.js" npm/wasm/
cp "$WORKDIR/office2pdf/crates/office2pdf/pkg/office2pdf_bg.wasm" npm/wasm/
OFFICE2PDF_VERSION="$VERSION" bun scripts/write-wasm-package.ts
