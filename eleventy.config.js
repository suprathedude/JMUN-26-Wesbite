import { readFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { hashAssets } from "./scripts/lib/hash-assets.mjs";
import { validateData } from "./scripts/lib/validate-data.mjs";

const FONT_DIR = "node_modules/@fontsource-variable/montserrat/files";
const iconCache = new Map();

// A URL counts as set only when it isn't empty and isn't a "TBC" placeholder.
const isSet = (url) => typeof url === "string" && url.trim() !== "" && !/TBC/i.test(url);

export default function (eleventyConfig) {
  // JS modules, page stylesheets, fonts, Lenis and the Cloudflare headers file.
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/css/pages": "css/pages" });
  eleventyConfig.addPassthroughCopy({ "node_modules/lenis/dist/lenis.mjs": "js/vendor/lenis.mjs" });
  eleventyConfig.addPassthroughCopy({
    [`${FONT_DIR}/montserrat-latin-wght-normal.woff2`]: "assets/fonts/montserrat-latin-wght-normal.woff2",
    [`${FONT_DIR}/montserrat-latin-wght-italic.woff2`]: "assets/fonts/montserrat-latin-wght-italic.woff2",
  });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon.svg": "assets/favicon.svg" });

  // src/css/site.11ty.js bundles the shared stylesheets; rebuild when any of them change.
  eleventyConfig.addWatchTarget("src/css/");

  eleventyConfig.addFilter("isSet", isSet);

  // Nav highlighting: exact match, or a section prefix (/committees/disec/ lights "Committees").
  // Links to a homepage section (/#faq) are never marked as the current page.
  eleventyConfig.addFilter("isActive", (url, pageUrl) => {
    if (!url || !pageUrl || url.includes("#")) return false;
    return url === pageUrl || (url !== "/" && pageUrl.startsWith(url));
  });

  // Short stable hash, used for the announcement dismissal key.
  eleventyConfig.addFilter("hash", (value) =>
    createHash("sha1").update(String(value)).digest("hex").slice(0, 8),
  );

  // "30 and 31 October 2026" from two ISO dates in the same month.
  eleventyConfig.addFilter("eventDates", (start, end) => {
    const opts = { timeZone: "Asia/Kolkata" };
    const s = new Date(start);
    const e = new Date(end);
    const day = (d) => d.toLocaleDateString("en-GB", { ...opts, day: "numeric" });
    const monthYear = e.toLocaleDateString("en-GB", { ...opts, month: "long", year: "numeric" });
    return `${day(s)} and ${day(e)} ${monthYear}`;
  });

  // Lucide icons, inlined from lucide-static with the spec's 1.5 px stroke.
  eleventyConfig.addFilter("lucide", (name, className = "") => {
    if (!iconCache.has(name)) {
      const raw = readFileSync(`node_modules/lucide-static/icons/${name}.svg`, "utf8");
      iconCache.set(
        name,
        raw
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace(/\s+/g, " ")
          .replace(/stroke-width="2"/, 'stroke-width="1.5"')
          .replace(/class="[^"]*"/, 'class="ICONCLASS" aria-hidden="true" focusable="false"')
          .replace(/ width="24" height="24"/, ' width="1em" height="1em"')
          .trim(),
      );
    }
    return iconCache.get(name).replace("ICONCLASS", className ? `icon ${className}` : "icon");
  });

  // Production builds start from an empty _site (so old hashed files don't pile up) and
  // fingerprint CSS, JS and fonts afterwards so _headers can cache them for a year.
  eleventyConfig.on("eleventy.before", ({ directories, runMode }) => {
    // Catch data-file mistakes first. A production build stops; `npm run dev` just warns.
    const problems = validateData();
    if (problems.length) {
      const message = `Problems in src/_data:\n  ${problems.join("\n  ")}`;
      if (runMode === "build") throw new Error(message);
      console.warn(message);
    }
    if (runMode === "build") rmSync(directories.output, { recursive: true, force: true });
  });
  eleventyConfig.on("eleventy.after", async ({ directories, runMode }) => {
    if (runMode === "build") await hashAssets(directories.output);
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "11ty.js", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
