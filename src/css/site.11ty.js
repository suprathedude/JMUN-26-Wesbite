// Bundles the shared stylesheets into one file, /css/site.css (SPEC 5: one shared
// stylesheet, plus small page stylesheets in css/pages/ only where a page needs one).
import { readFile } from "node:fs/promises";

const parts = ["tokens.css", "base.css", "components.css"];

export const data = {
  permalink: "/css/site.css",
  eleventyExcludeFromCollections: true,
};

export async function render() {
  const files = await Promise.all(
    parts.map((name) => readFile(new URL(`./${name}`, import.meta.url), "utf8")),
  );
  return files.join("\n");
}
