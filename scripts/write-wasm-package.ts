import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  BINARY_PACKAGE_PREFIX,
  resolveUpstreamVersion,
  UPSTREAM_REPO,
} from "./upstream-version.ts";

const pkg = await Bun.file("package.json").json();
const upstreamVersion = await resolveUpstreamVersion();
const name = `${BINARY_PACKAGE_PREFIX}-wasm`;
const dir = join("npm", "wasm");

await writeFile(
  join(dir, "package.json"),
  `${JSON.stringify(
    {
      name,
      version: pkg.version,
      description: `office2pdf ${upstreamVersion} compiled to WebAssembly.`,
      type: "module",
      license: "Apache-2.0",
      repository: pkg.repository,
      main: "./office2pdf.js",
      module: "./office2pdf.js",
      exports: {
        ".": "./office2pdf.js",
        "./office2pdf_bg.wasm": "./office2pdf_bg.wasm",
        "./package.json": "./package.json",
      },
      sideEffects: ["./office2pdf.js"],
      files: ["office2pdf.js", "office2pdf_bg.wasm"],
    },
    null,
    2,
  )}\n`,
);

await writeFile(
  join(dir, "README.md"),
  `# ${name}\n\n\`office2pdf\` ${upstreamVersion} compiled to WebAssembly from https://github.com/${UPSTREAM_REPO}.\n\nInstalled automatically as an optional dependency of [\`${pkg.name}\`](https://www.npmjs.com/package/${pkg.name}). Use that package rather than importing this one directly.\n`,
);

console.log(`prepared npm/wasm (${name}@${pkg.version}, office2pdf ${upstreamVersion})`);
