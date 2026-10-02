// npm run check (runs after the build)
// Checks every internal link and asset reference in _site: href, src, srcset and
// poster attributes, including #fragments, which must match an id on the target page.
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const SITE = path.resolve("_site");

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

async function exists(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

// Resolve a site URL path to a file the way the live server does (src/.htaccess).
async function resolveFile(urlPath) {
  const base = path.join(SITE, decodeURIComponent(urlPath));
  for (const candidate of urlPath.endsWith("/")
    ? [path.join(base, "index.html")]
    : [base, base + ".html", path.join(base, "index.html")]) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

function references(html) {
  const refs = [];
  const attr = /\s(href|src|poster|srcset)\s*=\s*("([^"]*)"|'([^']*)')/gi;
  for (const match of html.matchAll(attr)) {
    const value = match[3] ?? match[4] ?? "";
    if (match[1].toLowerCase() === "srcset") {
      for (const part of value.split(",")) refs.push(part.trim().split(/\s+/)[0]);
    } else {
      refs.push(value);
    }
  }
  return refs.filter(Boolean);
}

const idCache = new Map();
async function idsIn(file) {
  if (!idCache.has(file)) {
    const html = await readFile(file, "utf8");
    idCache.set(file, new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

async function main() {
  const pages = await walk(SITE);
  const problems = [];
  let checked = 0;

  for (const file of pages) {
    const html = await readFile(file, "utf8");
    const pageUrl = "/" + path.relative(SITE, file).split(path.sep).join("/").replace(/index\.html$/, "");
    for (const ref of references(html)) {
      if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref) || ref.startsWith("//")) continue;
      checked++;
      const url = new URL(ref, "https://site.test" + pageUrl);
      const target = await resolveFile(url.pathname);
      if (!target) {
        problems.push(`${pageUrl}: ${ref} (no such file)`);
        continue;
      }
      if (url.hash && url.hash !== "#" && target.endsWith(".html")) {
        const id = decodeURIComponent(url.hash.slice(1));
        if (!(await idsIn(target)).has(id)) problems.push(`${pageUrl}: ${ref} (no element with id "${id}")`);
      }
    }
  }

  if (problems.length) {
    console.error(`${problems.length} broken internal link(s) out of ${checked}:`);
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log(`All ${checked} internal links and assets in ${pages.length} pages resolve.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
