// Checks the data files in src/_data for the mistakes that are easy to make when
// editing JSON on GitHub's website. Each problem names the file, the item and the fix.
// Runs before every build (eleventy.config.js); a failed check stops the build, so a
// broken edit never replaces the live site.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const DATA = "src/_data";
const EVENT_TYPES = ["committee", "ceremony", "social", "meal", "break", "end"];
const GUIDE_STATUS = ["coming-soon", "available"];
const GROUPS = ["leadership", "usg"];

// A typo that breaks the JSON stops the build with the file name, the line and a hint,
// since "Unexpected token at position 812" doesn't say where to look.
const load = (name) => {
  const text = readFileSync(path.join(DATA, name), "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = error.message.match(/line (\d+) column (\d+)/);
    const where = match ? ` near line ${match[1]}, column ${match[2]}` : "";
    const line = match ? `\n  Line ${match[1]}: ${text.split("\n")[Number(match[1]) - 1]?.trim()}` : "";
    throw new Error(
      `src/_data/${name} has a typo${where}: ${error.message.replace(/ in JSON at.*$/, "")}.${line}\n` +
        "  Usually a comma is missing at the end of the line before, there's an extra comma " +
        "before a } or ], or a quote mark is missing. See docs/HOW_TO_UPDATE.md.",
    );
  }
};
const list = (values) => values.map((v) => `"${v}"`).join(", ");

// Asset paths in the data are relative to src/, e.g. "assets/img/committees/disec.jpg".
const missingFile = (p) => p && !/^https?:/.test(p) && !existsSync(path.join("src", p.replace(/^\//, "")));

export function validateData() {
  const problems = [];
  const add = (file, where, message) => problems.push(`${file}, ${where}: ${message}`);

  const site = load("site.json");
  for (const key of ["start", "end"]) {
    if (Number.isNaN(Date.parse(site[key]))) add("site.json", key, `"${site[key]}" isn't a date like 2026-10-30T08:00:00+05:30.`);
  }
  if (missingFile(site.crest)) add("site.json", "crest", `there's no file at src/${site.crest}.`);
  if (missingFile(site.hero?.image)) add("site.json", "hero.image", `there's no file at src/${site.hero.image}.`);
  // hero.video is a name without an extension, e.g. "assets/video/hero", for the two files
  // npm run media makes from src/assets/video/source/hero.mp4.
  if (site.hero?.video && !/TBC/.test(site.hero.video)) {
    for (const ext of [".av1.webm", ".h264.mp4"]) {
      if (missingFile(site.hero.video + ext)) add("site.json", "hero.video", `there's no file at src/${site.hero.video}${ext}. Run npm run media first.`);
    }
  }
  if (missingFile(site.sgLetter?.photo)) add("site.json", "sgLetter.photo", `there's no file at src/${site.sgLetter.photo}.`);
  (site.sponsors ?? []).forEach((s, i) => {
    if (!s.logo || missingFile(s.logo)) add("site.json", `sponsor ${i + 1} (${s.name})`, `needs a logo file; there's nothing at src/${s.logo}.`);
  });

  const committees = load("committees.json");
  const slugs = new Set();
  committees.forEach((c, i) => {
    const where = `committee ${i + 1} (${c.code || "no code"})`;
    if (!/^[a-z0-9-]+$/.test(c.slug ?? "")) add("committees.json", where, `slug "${c.slug}" must be lower case letters, numbers and hyphens (it becomes the web address).`);
    if (slugs.has(c.slug)) add("committees.json", where, `slug "${c.slug}" is used twice.`);
    slugs.add(c.slug);
    for (const field of ["code", "name", "agenda", "overview"]) {
      if (!c[field]) add("committees.json", where, `"${field}" is empty. Use "TBC" if it isn't known yet.`);
    }
    // Releasing a guide is one line: set guide.file. A file makes it "Available" whatever
    // the status says; status only matters while there's no file.
    if (c.guide?.status && !GUIDE_STATUS.includes(c.guide.status)) add("committees.json", where, `guide status "${c.guide.status}" must be one of ${list(GUIDE_STATUS)}.`);
    if (c.guide?.status === "available" && !c.guide.file) add("committees.json", where, `the guide is "available" but "file" is empty. Add the PDF's path, e.g. "assets/docs/guides/${c.slug}.pdf".`);
    if (c.guide?.file && !/\.pdf$/i.test(c.guide.file)) add("committees.json", where, `the guide file "${c.guide.file}" should be a PDF.`);
    for (const field of ["image", "logo"]) {
      if (missingFile(c[field])) add("committees.json", where, `there's no file at src/${c[field]} (${field}).`);
    }
    if (missingFile(c.guide?.file)) add("committees.json", where, `there's no guide PDF at src/${c.guide.file}.`);
    (c.eb ?? []).forEach((m, j) => {
      if (missingFile(m.photo)) add("committees.json", `${where}, EB member ${j + 1}`, `there's no photo at src/${m.photo}.`);
    });
  });

  // "row" puts people side by side on the page: everyone with the same number shares a row.
  const rowGroups = new Map();
  load("secretariat.json").forEach((p, i) => {
    const where = `person ${i + 1} (${p.name || "no name"})`;
    if (!p.name || !p.role) add("secretariat.json", where, "needs a name and a role.");
    if (!GROUPS.includes(p.group)) add("secretariat.json", where, `group "${p.group}" must be one of ${list(GROUPS)}.`);
    if (!Number.isInteger(p.row) || p.row < 1) {
      add("secretariat.json", where, `"row" must be a whole number like 3, with no quote marks.`);
    } else if (rowGroups.has(p.row) && rowGroups.get(p.row) !== p.group) {
      add("secretariat.json", where, `row ${p.row} already has people from the "${rowGroups.get(p.row)}" group. Give "${p.group}" people their own row number.`);
    } else {
      rowGroups.set(p.row, p.group);
    }
    if (missingFile(p.photo)) add("secretariat.json", where, `there's no photo at src/${p.photo}.`);
  });

  const ids = new Set();
  load("schedule.json").days.forEach((day, i) => {
    const where = `day ${i + 1}`;
    if (ids.has(day.id)) add("schedule.json", where, `id "${day.id}" is used twice.`);
    ids.add(day.id);
    day.events.forEach((e, j) => {
      if (!EVENT_TYPES.includes(e.type)) add("schedule.json", `${where}, event ${j + 1} (${e.title})`, `type "${e.type}" must be one of ${list(EVENT_TYPES)}.`);
    });
  });

  load("faq.json").forEach((item, i) => {
    if (!item.question || !item.answer) add("faq.json", `item ${i + 1}`, "needs a question and an answer.");
  });

  const resources = load("resources.json");
  (resources.documents ?? []).forEach((doc, i) => {
    if (missingFile(doc.file)) add("resources.json", `documents ${i + 1} (${doc.title})`, `there's no file at src/${doc.file}.`);
  });
  if (missingFile(resources.ip?.image)) add("resources.json", "ip, image", `there's no file at src/${resources.ip.image}.`);
  (resources.ip?.guides ?? []).forEach((doc, i) => {
    const where = `ip, guide ${i + 1} (${doc.title})`;
    if (missingFile(doc.file)) add("resources.json", where, `there's no file at src/${doc.file}.`);
    if (doc.icon && !existsSync(`node_modules/lucide-static/icons/${doc.icon}.svg`)) {
      add("resources.json", where, `there's no icon called "${doc.icon}". Use a name from lucide.dev/icons.`);
    }
  });
  resources.researchLinks.forEach((link, i) => {
    if (!/^https:\/\//.test(link.url ?? "")) add("resources.json", `researchLinks ${i + 1} (${link.title})`, "the url must start with https://");
  });

  const guide = load("newToMun.json");
  for (const key of ["steps", "checklist", "onTheDay", "phrases", "glossary"]) {
    if (!Array.isArray(guide[key]) || guide[key].length === 0) add("newToMun.json", key, "needs at least one item.");
  }
  (guide.steps ?? []).forEach((s, i) => {
    if (!s.title || !s.text) add("newToMun.json", `step ${i + 1}`, "needs a title and a text.");
  });
  (guide.checklist ?? []).forEach((c, i) => {
    if (!c.title) add("newToMun.json", `checklist item ${i + 1}`, "needs a title.");
  });
  (guide.onTheDay ?? []).forEach((p, i) => {
    const where = `onTheDay ${i + 1} (${p.title || "no title"})`;
    if (!p.title || !Array.isArray(p.items)) add("newToMun.json", where, "needs a title and a list of items.");
    if (p.icon && !existsSync(`node_modules/lucide-static/icons/${p.icon}.svg`)) {
      add("newToMun.json", where, `there's no icon called "${p.icon}". Use a name from lucide.dev/icons.`);
    }
  });
  (guide.phrases ?? []).forEach((p, i) => {
    if (!p.when || !p.text) add("newToMun.json", `phrase ${i + 1}`, "needs a when and a text.");
  });
  (guide.glossary ?? []).forEach((t, i) => {
    if (!t.term || !t.definition) add("newToMun.json", `glossary ${i + 1}`, "needs a term and a definition.");
  });

  const night = load("socialNight.json");
  if (missingFile(night.photoBoothImage)) add("socialNight.json", "photoBoothImage", `there's no file at src/${night.photoBoothImage}.`);
  (night.faq ?? []).forEach((item, i) => {
    if (!item.question || !item.answer) add("socialNight.json", `faq ${i + 1}`, "needs a question and an answer.");
  });

  return problems;
}
