// npm run shots
// Full-page screenshots of every page in _site at 390x844 and 1440x900, plus a few
// interaction states (collapsed nav, dropdown, mobile menu, tablet nav), saved to
// screenshots/. Run `npm run build` first.
//
//   npm run shots                 every page and every state
//   npm run shots -- home faq     only pages whose name contains one of the words
//   npm run shots -- --sections   also save each <section> of each page separately,
//                                 in screenshots/sections/, for comparing with reference/
//
// On a new machine, install the browser once: npx playwright install chromium
import { chromium } from "playwright";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { serve } from "./lib/serve.mjs";
import { findPages } from "./lib/pages.mjs";

const SITE = "_site";
const OUT = "screenshots";
const filters = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const withSections = process.argv.includes("--sections");

const VIEWPORTS = [
  { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

// Playwright wants the size inside `viewport`; the rest are context options.
const contextFor = ({ width, height, ...rest }, reducedMotion) => ({
  viewport: { width, height },
  ...rest,
  reducedMotion,
});

// Scroll to the bottom and back so lazy images and on-view effects have run. Full-page
// captures count as off-screen, so sections using content-visibility: auto are forced to
// draw here (visitors scrolling the real page see them normally).
async function settle(page) {
  await page.addStyleTag({ content: "* { content-visibility: visible !important; }" });
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = "eager";
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
    await document.fonts.ready;
  });
  await page.waitForTimeout(300);
}

// Each top-level block in <main>, cropped from the full page.
async function shootSections(page, name, width) {
  const dir = path.join(OUT, "sections");
  await mkdir(dir, { recursive: true });
  const blocks = await page.evaluate(() =>
    [...document.querySelectorAll("main > *")].map((el) => {
      const r = el.getBoundingClientRect();
      const label = el.id || el.className.split(" ").filter(Boolean).pop() || el.tagName.toLowerCase();
      return { label, y: r.top + scrollY, h: r.height };
    }),
  );
  let saved = 0;
  for (const [i, b] of blocks.entries()) {
    if (b.h < 1) continue;
    const file = path.join(dir, `${name}-${String(i + 1).padStart(2, "0")}-${b.label}-${width}.png`);
    await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: b.y, width, height: Math.min(b.h, 3000) } });
    saved++;
  }
  return saved;
}

// Interaction states worth checking after nav or homepage changes.
const STATES = [
  {
    name: "home-nav-collapsed-1440",
    viewport: VIEWPORTS[1],
    async run(page) {
      await page.mouse.move(700, 600);
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(1200);
    },
  },
  {
    name: "home-nav-restored-1440",
    viewport: VIEWPORTS[1],
    async run(page) {
      await page.mouse.move(700, 600);
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(1000);
      await page.mouse.wheel(0, -250);
      await page.waitForTimeout(1000);
    },
  },
  {
    name: "home-nav-more-open-1440",
    viewport: VIEWPORTS[1],
    async run(page) {
      await page.hover("[data-more-btn]");
      await page.waitForTimeout(500);
    },
  },
  {
    name: "home-menu-open-390",
    viewport: VIEWPORTS[0],
    async run(page) {
      await page.click("[data-menu-btn]");
      await page.waitForTimeout(500);
    },
  },
  {
    name: "home-wheel-1440",
    viewport: VIEWPORTS[1],
    async run(page) {
      await page.evaluate(() => document.querySelector(".glance")?.scrollIntoView({ block: "start" }));
      await page.waitForTimeout(2400);
    },
  },
  {
    name: "home-intro-1440",
    intro: true,
    viewport: VIEWPORTS[1],
    async run(page) {
      // Freeze the placard intro at 1.25 s: every placard up, nothing leaving yet.
      await page.evaluate(() => {
        for (const a of document.getAnimations()) {
          a.pause();
          a.currentTime = 1250;
        }
      });
    },
  },
  {
    name: "home-intro-390",
    intro: true,
    viewport: VIEWPORTS[0],
    async run(page) {
      await page.evaluate(() => {
        for (const a of document.getAnimations()) {
          a.pause();
          a.currentTime = 800;
        }
      });
    },
  },
  {
    name: "committees-hover-1440",
    path: "/committees/",
    viewport: VIEWPORTS[1],
    async run(page) {
      await page.evaluate(() => scrollTo(0, 420));
      await page.waitForTimeout(300);
      const box = await page.locator(".tile").nth(4).boundingBox();
      await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.4, { steps: 8 });
      await page.waitForTimeout(900);
    },
  },
  {
    name: "committees-search-390",
    path: "/committees/",
    viewport: VIEWPORTS[0],
    async run(page) {
      await page.locator("input[data-search]").fill("un");
      await page.waitForTimeout(300);
    },
  },
  {
    name: "secretariat-flipped-1440",
    path: "/secretariat/",
    viewport: VIEWPORTS[1],
    async run(page) {
      await page.evaluate(() => scrollTo(0, 330));
      await page.locator(".person__flip").nth(1).click();
      await page.waitForTimeout(900);
    },
  },
  {
    name: "resources-ip-390",
    path: "/resources/",
    viewport: VIEWPORTS[0],
    async run(page) {
      await page.locator("#ip-title").evaluate((el) => el.scrollIntoView({ block: "start" }));
      await page.waitForTimeout(300);
    },
  },
  {
    name: "social-night-sky-1440",
    path: "/social-night/",
    viewport: VIEWPORTS[1],
    async run(page) {
      await page.waitForTimeout(1500);
    },
  },
  {
    name: "social-night-sky-390",
    path: "/social-night/",
    viewport: VIEWPORTS[0],
    async run(page) {
      await page.waitForTimeout(1500);
    },
  },
  { name: "home-nav-1024", viewport: { width: 1024, height: 768, deviceScaleFactor: 1 }, async run() {} },
  { name: "home-nav-1250", viewport: { width: 1250, height: 800, deviceScaleFactor: 1 }, async run() {} },
];

const wanted = (name) => filters.length === 0 || filters.some((f) => name.includes(f));

async function main() {
  try {
    await stat(SITE);
  } catch {
    console.error(`No ${SITE}/ folder. Run "npm run build" first.`);
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });
  const { server, origin } = await serve(SITE);
  const browser = await chromium.launch();
  let count = 0;

  try {
    for (const viewport of VIEWPORTS) {
      // Reduced motion gives stable final states (no intro, no count-up in progress).
      const context = await browser.newContext(contextFor(viewport, "reduce"));
      const page = await context.newPage();
      for (const { url, name } of await findPages(SITE)) {
        if (!wanted(name)) continue;
        await page.goto(origin + url, { waitUntil: "networkidle" });
        await settle(page);
        const file = path.join(OUT, `${name}-${viewport.width}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(file);
        count++;
        if (withSections) count += await shootSections(page, name, viewport.width);
      }
      await context.close();
    }

    for (const state of STATES) {
      if (!wanted(state.name)) continue;
      const context = await browser.newContext(contextFor(state.viewport, "no-preference"));
      // Only the intro states should see the placard intro; elsewhere it would hide the hero.
      if (!state.intro) await context.addInitScript(() => sessionStorage.setItem("oakjmun-intro", "1"));
      const page = await context.newPage();
      await page.goto(origin + (state.path ?? "/"), { waitUntil: state.intro ? "domcontentloaded" : "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await state.run(page);
      if (state.intro) await page.waitForTimeout(150);
      const file = path.join(OUT, `${state.name}.png`);
      await page.screenshot({ path: file });
      console.log(file);
      count++;
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`${count} screenshots in ${OUT}/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
