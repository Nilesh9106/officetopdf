# officetopdf

TypeScript package scaffold managed with Bun.

## Install

```bash
bun add officetopdf
```

## Usage

```ts
import { OfficeToPdfError } from "officetopdf";
```

## Development

```bash
bun install
bun run format
bun run lint
bun run typecheck
bun test
bun run build
```

Run all quality gates at once:

```bash
bun run ci:check
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

[MIT](./LICENSE)

## Using this template

After creating a repo from this template, find-and-replace in this order:

1. `officetopdf` → your package name (`package.json` name/repository/bugs/homepage, `README.md`, `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/config.yml`)
2. `OfficeToPdfError` → your error class, and rename `src/errors/OfficeToPdfError.ts` to match
3. `Nilesh9106` → your GitHub user (`package.json` URLs, `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/config.yml`)
4. Set `description` and `keywords` in `package.json`, reset `version` to `0.0.1`
5. Update the copyright line in `LICENSE`

Then run `bun install && bun run ci:check`.

Publishing is handled by `.github/workflows/publish.yml` on a `v*.*.*` tag push, using npm provenance — no npm token needed, but the package must be linked to the repo on npm (first publish may need to be manual).
