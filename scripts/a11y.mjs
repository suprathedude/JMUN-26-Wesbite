// npm run a11y
// Accessibility checks on every page in _site at 390 and 1440 px wide, plus the open menus,
// a flipped Secretariat card and an open FAQ answer (SPEC 6 and Task 8):
//   - axe-core, WCAG 2.2 A and AA rules plus axe's best practices
//   - heading order: one h1, and no level skipped on the way down
//   - text contrast measured from the rendered pixels (scripts/lib/contrast.mjs), since axe
//     can't judge text over the site's gradients and photos
//   - keyboard: Tab through the whole page; the skip link comes first, and every stop has a
//     visible focus ring, is visible itself, ends up on screen and isn't hidden from screen
//     readers (desktop width only, where every control is in the tab order)
//   - at 360 px: nothing scrolls sideways, labels are at least 11 px and running text at
//     least 16 px (CLAUDE.md)
// Run `npm run build` first. Exits with an error if anything fails, so it can gate a deploy.
//
//   npm run a11y                 every page
//   npm run a11y -- committees   only pages whose name contains one of the words
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { stat } from "node:fs/promises";
import { serve } from "./lib/serve.mjs";
import { findPages } from "./lib/pages.mjs";
import { contrastProblems } from "./lib/contrast.mjs";

const SITE = "_site";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const filters = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const wanted = (name) => filters.length === 0 || filters.some((f) => name.includes(f));

const VIEWPORTS = [
  { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

// Interaction states, so axe also sees what only appears after a click.
const STATES = [
  { name: "home: mobile menu open", path: "/", width: 390, run: (page) => page.click("[data-menu-btn]") },
  { name: "home: More dropdown open", path: "/", width: 1440, run: (page) => page.focus("[data-more-btn]").then(() => page.keyboard.press("Enter")) },
  { name: "secretariat: card flipped", path: "/secretariat/", width: 1440, run: (page) => page.locator(".person__flip").first().click() },
  { name: "social night: second FAQ open", path: "/social-night/", width: 390, run: (page) => page.locator(".faq-q").nth(1).click() },
  { name: "committees: no results", path: "/committees/", width: 1440, run: (page) => page.fill("input[data-search]", "zzzz") },
];

// One h1, and headings only ever go one level deeper at a time.
function headingProblems() {
  const problems = [];
  const levels = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((h) => ({
    level: Number(h.tagName[1]),
    text: h.textContent.trim().replace(/\s+/g, " ").slice(0, 50),
  }));
  const h1s = levels.filter((h) => h.level === 1).length;
  if (h1s !== 1) problems.push(`${h1s} h1 headings (there should be one)`);
  let previous = 0;
  for (const h of levels) {
    if (h.level > previous + 1) problems.push(`h${h.level} "${h.text}" comes after h${previous || "nothing"}`);
    previous = h.level;
  }
  return problems;
}

// Draw everything a full-page capture would otherwise skip: lazy images and sections using
// content-visibility: auto.
async function settle(page) {
  await page.addStyleTag({ content: "* { content-visibility: visible !important; }" });
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = "eager";
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    scrollTo(0, 0);
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle");
}

// Tab through the page and check every stop.
async function keyboardProblems(page) {
  const problems = [];
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press("Tab");
    // Let focus styles and the skip link's slide-in finish. (With reduced motion every change
    // still runs as a 0.01 ms transition, which can take a frame or two to show up here.)
    await page.waitForTimeout(50);
    const stop = await page.evaluate((index) => {
      const el = document.activeElement;
      if (!el || el === document.body) return { done: true };
      const key = el.outerHTML.slice(0, 120) + "|" + Math.round(el.getBoundingClientRect().top + scrollY);
      const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("href") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
      const problems = [];
      if (index === 0 && !el.classList.contains("skip-link")) problems.push("the first Tab doesn't reach the skip link");
      // Read the finished style: with transitions off the computed value jumps to its end.
      const ring = (node) => {
        if (!node) return false;
        const before = node.style.transition;
        node.style.transition = "none";
        const cs = getComputedStyle(node);
        const has = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow !== "none" && cs.boxShadow !== "");
        node.style.transition = before;
        return has;
      };
      // The ring can be on the element, its first child, or a card around it (:has()).
      const nearby = [el, el.firstElementChild, el.parentElement, el.parentElement?.parentElement];
      if (!nearby.some(ring)) problems.push("no visible focus ring");
      const r = el.getBoundingClientRect();
      let opacity = 1;
      for (let e = el; e; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
      if (r.width < 2 || r.height < 2 || getComputedStyle(el).visibility === "hidden" || opacity < 0.1) problems.push("focused but invisible");
      else if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) problems.push("focused off screen");
      if (el.closest('[aria-hidden="true"]')) problems.push("focusable inside aria-hidden");
      return { key, name, problems };
    }, i);
    if (stop.done || seen.has(stop.key)) break;
    seen.add(stop.key);
    for (const p of stop.problems) problems.push(`"${stop.name}": ${p}`);
  }
  return problems;
}

// At 360 px: no sideways scrolling, and text no smaller than CLAUDE.md allows. Running text
// (40 characters or more, not in capitals) needs 16 px; anything else 11 px.
function phoneProblems() {
  const problems = [];
  const width = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > width) problems.push(`the page is ${document.documentElement.scrollWidth} px wide`);
  const describe = (el) => el.tagName.toLowerCase() + (el.classList.length ? "." + [...el.classList].slice(0, 2).join(".") : "");
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest('[aria-hidden="true"], .visually-hidden, [hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > width + 1 && !el.closest(".orb, .sn-sky, .marquee, [data-marquee]") && getComputedStyle(el).position !== "fixed") {
      problems.push(`${describe(el)} reaches ${Math.round(r.right)} px`);
    }
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own.length) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const text = own.map((n) => n.textContent.trim()).join(" ");
    const size = parseFloat(cs.fontSize);
    // The footer's copyright and credit line are fine print, held to the label minimum.
    const running = text.length >= 40 && cs.textTransform !== "uppercase" && !el.closest(".footer__bottom");
    const min = running ? 16 : 11;
    if (size < min - 0.01) problems.push(`${describe(el)} is ${size.toFixed(1)} px ("${text.slice(0, 30)}"), minimum ${min}`);
  }
  return [...new Set(problems)].slice(0, 12);
}

async function check(page, label, { contrast = false, keyboard = false } = {}) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const issues = results.violations.map((v) => ({
    label,
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    count: v.nodes.length,
  }));
  for (const problem of await page.evaluate(headingProblems)) {
    issues.push({ label, id: "heading-order", impact: "moderate", help: problem, targets: [], count: 1 });
  }
  if (keyboard) {
    for (const problem of await keyboardProblems(page)) {
      issues.push({ label, id: "keyboard", impact: "serious", help: problem, targets: [], count: 1 });
    }
    await page.evaluate(() => document.activeElement?.blur());
  }
  if (contrast) {
    await settle(page);
    for (const problem of await contrastProblems(page)) {
      issues.push({ label, id: "contrast", impact: "serious", help: problem, targets: [], count: 1 });
    }
  }
  return { issues };
}

async function main() {
  try {
    await stat(SITE);
  } catch {
    console.error(`No ${SITE}/ folder. Run "npm run build" first.`);
    process.exit(1);
  }
  const { server, origin } = await serve(SITE);
  const browser = await chromium.launch();
  const all = [];
  let checked = 0;

  const open = async (viewport, path) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch, deviceScaleFactor: viewport.deviceScaleFactor, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(origin + path, { waitUntil: "networkidle" });
    return { context, page };
  };

  try {
    for (const viewport of VIEWPORTS) {
      for (const { url, name } of await findPages(SITE)) {
        if (!wanted(name)) continue;
        const { context, page } = await open(viewport, url);
        const result = await check(page, `${name} at ${viewport.width}`, { contrast: true, keyboard: viewport.width === 1440 });
        all.push(...result.issues);
        checked++;
        await context.close();
      }
    }
    const small = { width: 360, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
    for (const { url, name } of await findPages(SITE)) {
      if (!wanted(name)) continue;
      const { context, page } = await open(small, url);
      await settle(page);
      for (const problem of await page.evaluate(phoneProblems)) {
        all.push({ label: `${name} at 360`, id: "phone", impact: "serious", help: problem, targets: [], count: 1 });
      }
      checked++;
      await context.close();
    }
    for (const state of STATES) {
      if (!wanted(state.name)) continue;
      const viewport = VIEWPORTS.find((v) => v.width === state.width);
      const { context, page } = await open(viewport, state.path);
      await state.run(page);
      await page.waitForTimeout(400);
      const result = await check(page, `${state.name} at ${state.width}`);
      all.push(...result.issues);
      checked++;
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  for (const i of all) {
    console.log(`${i.label}: [${i.impact}] ${i.id}: ${i.help}${i.count > 1 ? ` (${i.count} elements)` : ""}`);
    for (const t of i.targets) console.log(`    ${t}`);
  }
  console.log(all.length ? `${all.length} problems in ${checked} checks.` : `No problems in ${checked} checks.`);
  process.exit(all.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
