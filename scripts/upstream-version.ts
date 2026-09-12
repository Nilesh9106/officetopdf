export const UPSTREAM_REPO = "developer0hye/office2pdf";

export const BINARY_PACKAGE_PREFIX = "officetopdf";

export async function resolveUpstreamVersion(): Promise<string> {
  const pinned = process.env.OFFICE2PDF_VERSION;
  if (pinned) return pinned;

  const response = await fetch(`https://api.github.com/repos/${UPSTREAM_REPO}/releases/latest`, {
    headers: { accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error(`Unable to resolve the latest ${UPSTREAM_REPO} release (${response.status}).`);
  }

  const { tag_name } = (await response.json()) as { tag_name?: string };
  if (!tag_name) throw new Error(`Latest ${UPSTREAM_REPO} release has no tag name.`);
  return tag_name;
}

if (import.meta.main) console.log(await resolveUpstreamVersion());
