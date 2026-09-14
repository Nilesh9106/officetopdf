import { $ } from "bun";

const PLATFORM_DIRS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "linux-x64-musl",
  "win32-x64",
];

const version = prompt("Version to release (e.g. 0.1.0):")?.trim();
if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("Invalid version.");
  process.exit(1);
}

if ((await $`git status --porcelain`.text()).trim()) {
  console.error("Working tree is not clean.");
  process.exit(1);
}

if ((await $`git tag -l v${version}`.text()).trim()) {
  console.error(`Tag v${version} already exists. Pick a new version.`);
  process.exit(1);
}

type Manifest = {
  version: string;
  optionalDependencies?: Record<string, string>;
};

async function writeVersion(path: string, mutate: (pkg: Manifest) => void) {
  const pkg: Manifest = await Bun.file(path).json();
  mutate(pkg);
  await Bun.write(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

await writeVersion("package.json", (pkg) => {
  pkg.version = version;
  for (const name of Object.keys(pkg.optionalDependencies ?? {})) {
    // biome-ignore lint/style/noNonNullAssertion: guarded by the loop source
    pkg.optionalDependencies![name] = version;
  }
});

for (const dir of PLATFORM_DIRS) {
  await writeVersion(`npm/${dir}/package.json`, (pkg) => {
    pkg.version = version;
  });
}

await $`bun run format`;
await $`bun run ci:check`;

await $`git add package.json npm/*/package.json`;
await $`git commit -m ${`chore(release): ${version}`}`;
await $`git push origin main`;
await $`git tag -a v${version} -m ${`v${version}`}`;
await $`git push origin v${version}`;

console.log(`Released v${version}. Check: gh run list --workflow "Publish to npm" --limit 3`);
