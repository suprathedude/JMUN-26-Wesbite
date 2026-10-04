import { readFileSync, readdirSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { hashAssets } from "./scripts/lib/hash-assets.mjs";
import { validateData } from "./scripts/lib/validate-data.mjs";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

const FONT_DIR = "node_modules/@fontsource-variable/montserrat/files";
const iconCache = new Map();

// A URL counts as set only when it isn't empty and isn't a "TBC" placeholder.
const isSet = (url) => typeof url === "string" && url.trim() !== "" && !/TBC/i.test(url);

export default function (eleventyConfig) {
  // JS modules, page stylesheets, fonts and the server settings for GoDaddy.
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/css/pages": "css/pages" });
  eleventyConfig.addPassthroughCopy({
    [`${FONT_DIR}/montserrat-latin-wght-normal.woff2`]: "assets/fonts/montserrat-latin-wght-normal.woff2",
    [`${FONT_DIR}/montserrat-latin-wght-italic.woff2`]: "assets/fonts/montserrat-latin-wght-italic.woff2",
  });
  // .htaccess for GoDaddy's Linux (Apache) hosting, web.config for its Windows hosting.
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess", "src/web.config": "web.config" });
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon.png": "assets/favicon.png" });
  // Background guides and other documents (PDFs keep their names; see src/.htaccess).
  eleventyConfig.addPassthroughCopy("src/assets/docs/**/*.pdf");
  eleventyConfig.addPassthroughCopy("src/assets/video/*.{webm,mp4}"); // npm run media's output, not the sources

  // Every <img> becomes a <picture> with avif and webp sizes (SPEC 5). Lazy by default; the
  // hero sets loading="eager" and fetchpriority="high" itself. Per image, eleventy:widths
  // picks the sizes to make.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    widths: [400, 800, 1200, 1600],
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async" },
    },
  });

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

  // "Twelve" for 12, for sentences that start with a count.
  const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
  eleventyConfig.addFilter("numberWord", (n) => WORDS[n] ?? String(n));

  // "30 October" from an ISO date; "30 Oct" with dayMonth("short").
  eleventyConfig.addFilter("dayMonth", (iso, month = "long") =>
    new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month }),
  );

  // Fills {tokens} in copy from site.json, e.g. "{count} committees".
  eleventyConfig.addFilter("fill", (text, values = {}) =>
    String(text).replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match)),
  );

  // "1 hour", "30 minutes", "1 hour 30 minutes" between two times like "8:00 am" and "9:30 am"; empty if
  // either is missing or TBC.
  const minutes = (t) => {
    const m = String(t ?? "").trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
    if (!m) return null;
    return ((Number(m[1]) % 12) + (m[3] === "pm" ? 12 : 0)) * 60 + Number(m[2]);
  };
  eleventyConfig.addFilter("duration", (start, end) => {
    const a = minutes(start);
    const b = minutes(end);
    if (a === null || b === null || b <= a) return "";
    const mins = b - a;
    const hrs = Math.floor(mins / 60);
    const rest = mins % 60;
    const h = hrs ? `${hrs} ${hrs === 1 ? "hour" : "hours"}` : "";
    const m = rest ? `${rest} ${rest === 1 ? "minute" : "minutes"}` : "";
    return [h, m].filter(Boolean).join(" ");
  });

  // Splits "350+" into a number to count up to and a suffix; null for "XIV".
  eleventyConfig.addFilter("countParts", (value) => {
    const match = String(value).match(/^(\d+)(.*)$/);
    return match ? { num: Number(match[1]), suffix: match[2] } : null;
  });

  // How many committees have a released background guide (guide.file set).
  eleventyConfig.addFilter("guidesOut", (list) => (list ?? []).filter((c) => isSet(c?.guide?.file)).length);

  // Items whose field equals a value: secretariat | where("group", "usg").
  eleventyConfig.addFilter("where", (list, key, value) => (list ?? []).filter((item) => item?.[key] === value));

  // "VT" for "Vihaan T."; "TBC" for a name that's still TBC (PLAN.md 5.2, S7).
  eleventyConfig.addFilter("initials", (name) => {
    if (/TBC/.test(name ?? "")) return "TBC";
    return String(name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
  });

  // "un.org" from "https://www.un.org/en/".
  eleventyConfig.addFilter("domain", (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
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

  // Production builds start from a cleared _site (so old hashed files don't pile up) and
  // fingerprint CSS, JS and fonts afterwards so the server can cache them for a year
  // (src/.htaccess).
  eleventyConfig.on("eleventy.before", ({ directories, runMode }) => {
    // Catch data-file mistakes first. A production build stops; `npm run dev` just warns.
    const problems = validateData();
    if (problems.length) {
      const message = `Problems in src/_data:\n  ${problems.join("\n  ")}`;
      if (runMode === "build") throw new Error(message);
      console.warn(message);
    }
    // Clear the last build, except img/: its names are content hashes, so keeping it lets
    // eleventy-img skip re-encoding unchanged pictures (a fresh clone builds them all).
    if (runMode === "build") {
      let entries = [];
      try {
        entries = readdirSync(directories.output);
      } catch {
        // No previous build.
      }
      for (const entry of entries) {
        if (entry !== "img") rmSync(`${directories.output}/${entry}`, { recursive: true, force: true });
      }
    }
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
