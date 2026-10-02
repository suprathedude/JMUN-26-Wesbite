// Every page in a built site: { url, name } for each index.html and the 404 page, sorted.
// Shared by screenshot.mjs and a11y.mjs.
import { readdir } from "node:fs/promises";
import path from "node:path";

export async function findPages(dir, base = dir) {
  const pages = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) pages.push(...(await findPages(full, base)));
    else if (entry.name === "index.html" || entry.name === "404.html") {
      const rel = path.relative(base, full).split(path.sep).join("/");
      const url = "/" + rel.replace(/index\.html$/, "");
      const name = rel === "index.html" ? "home" : rel.replace(/\/?index\.html$/, "").replace(/\.html$/, "").replaceAll("/", "-");
      pages.push({ url, name });
    }
  }
  return pages.sort((a, b) => a.url.localeCompare(b.url));
}
