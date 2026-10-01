// Renames CSS, JS and font files in the build output to include a content hash
// (site.css -> site.3f9a1c2b.css) and rewrites every reference to them, so
// _headers can mark them immutable. Runs after `eleventy` in build mode only.
import { createHash } from "node:crypto";
import { readFile, writeFile, rename, readdir } from "node:fs/promises";
import path from "node:path";

const HASHED = /\.[0-9a-f]{8}\.[a-z0-9]+$/;

async function walk(dir, exts) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, exts)));
    else if (exts.includes(path.extname(entry.name)) && !HASHED.test(entry.name)) out.push(full);
  }
  return out;
}

function rewrite(text, manifest) {
  if (manifest.size === 0) return text;
  const keys = [...manifest.keys()]
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(?<=["'(=,\\s])(${keys.join("|")})(?=["'),\\s>?#])`, "g");
  return text.replace(pattern, (url) => manifest.get(url));
}

async function hashFiles(files, outDir, manifest) {
  for (const file of files) {
    const buf = await readFile(file);
    const hash = createHash("sha256").update(buf).digest("hex").slice(0, 8);
    const ext = path.extname(file);
    const hashed = `${file.slice(0, -ext.length)}.${hash}${ext}`;
    await rename(file, hashed);
    const toUrl = (p) => "/" + path.relative(outDir, p).split(path.sep).join("/");
    manifest.set(toUrl(file), toUrl(hashed));
  }
}

async function rewriteFiles(files, manifest) {
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const next = rewrite(text, manifest);
    if (next !== text) await writeFile(file, next);
  }
}

export async function hashAssets(outDir) {
  const manifest = new Map();

  // Fonts first, because the stylesheets point at them.
  await hashFiles(await walk(path.join(outDir, "assets/fonts"), [".woff2"]), outDir, manifest);

  const css = await walk(path.join(outDir, "css"), [".css"]);
  await rewriteFiles(css, manifest);
  await hashFiles(css, outDir, manifest);

  // JS modules never import each other by path (see PLAN.md 4.6), so they can be hashed as they are.
  await hashFiles(await walk(path.join(outDir, "js"), [".js", ".mjs"]), outDir, manifest);

  await rewriteFiles(await walk(outDir, [".html"]), manifest);
  return manifest;
}
