import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";

import {
  BINARY_PACKAGE_PREFIX,
  resolveUpstreamVersion,
  UPSTREAM_REPO,
} from "./upstream-version.ts";

const UPSTREAM_VERSION = await resolveUpstreamVersion();

const pkg = await Bun.file("package.json").json();

const TARGETS = [
  { name: "darwin-arm64", rustTarget: "aarch64-apple-darwin", os: "darwin", cpu: "arm64" },
  { name: "darwin-x64", rustTarget: "x86_64-apple-darwin", os: "darwin", cpu: "x64" },
  { name: "linux-arm64", rustTarget: "aarch64-unknown-linux-gnu", os: "linux", cpu: "arm64" },
  {
    name: "linux-x64",
    rustTarget: "x86_64-unknown-linux-gnu",
    os: "linux",
    cpu: "x64",
    libc: "glibc",
  },
  {
    name: "linux-x64-musl",
    rustTarget: "x86_64-unknown-linux-musl",
    os: "linux",
    cpu: "x64",
    libc: "musl",
  },
  {
    name: "win32-x64",
    packageName: "windows-x64",
    rustTarget: "x86_64-pc-windows-msvc",
    os: "win32",
    cpu: "x64",
  },
];

async function prepare(target: (typeof TARGETS)[number]) {
  const isWindows = target.os === "win32";
  const extension = isWindows ? "zip" : "tar.gz";
  const archive = `office2pdf-${UPSTREAM_VERSION}-${target.rustTarget}.${extension}`;
  const url = `https://github.com/${UPSTREAM_REPO}/releases/download/${UPSTREAM_VERSION}/${archive}`;

  const packageName = `${BINARY_PACKAGE_PREFIX}-${target.packageName ?? target.name}`;
  const packageDir = join("npm", target.name);
  const stagingDir = join(packageDir, ".staging");
  await rm(packageDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  const archivePath = join(stagingDir, archive);
  await $`curl --fail --location --silent --show-error --output ${archivePath} ${url}`;

  if (isWindows) await $`unzip -q -o ${archivePath} -d ${stagingDir}`;
  else await $`tar xzf ${archivePath} -C ${stagingDir}`;

  const executable = isWindows ? "office2pdf.exe" : "office2pdf";
  const extracted = [...new Bun.Glob(`**/${executable}`).scanSync(stagingDir)][0];
  if (!extracted) throw new Error(`Binary not found inside ${archive}`);

  await $`install -m 755 ${join(stagingDir, extracted)} ${join(packageDir, executable)}`;
  await rm(stagingDir, { recursive: true, force: true });

  await writeFile(
    join(packageDir, "package.json"),
    `${JSON.stringify(
      {
        name: packageName,
        version: pkg.version,
        description: `office2pdf binary for ${target.name}.`,
        license: "Apache-2.0",
        repository: pkg.repository,
        os: [target.os],
        cpu: [target.cpu],
        ...(target.libc ? { libc: [target.libc] } : {}),
        files: [executable],
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    join(packageDir, "README.md"),
    `# ${packageName}\n\nPrebuilt \`office2pdf\` ${UPSTREAM_VERSION} binary (${target.rustTarget}) from https://github.com/${UPSTREAM_REPO}.\n\nInstalled automatically as an optional dependency of [\`${pkg.name}\`](https://www.npmjs.com/package/${pkg.name}).\n`,
  );

  console.log(`prepared npm/${target.name}`);
}

await Promise.all(TARGETS.map(prepare));
