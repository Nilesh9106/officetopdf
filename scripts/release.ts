import { $ } from "bun";

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

const pkg = await Bun.file("package.json").json();
pkg.version = version;
await Bun.write("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

await $`bun run format`;
await $`bun run ci:check`;

await $`git add package.json`;
await $`git commit -m ${`chore(release): ${version}`}`;
await $`git push origin main`;
await $`git tag -a v${version} -m ${`v${version}`}`;
await $`git push origin v${version}`;

console.log(`Released v${version}. Check: gh run list --workflow "Publish to npm" --limit 3`);
