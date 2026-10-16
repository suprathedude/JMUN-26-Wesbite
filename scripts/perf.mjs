// Speed check for every page on a slowed-down laptop (16 October). Builds nothing: run
// `npm run build` first.
//
//   npm run perf                       every page, desktop (1440 x 900), CPU 4x slower
//   npm run perf -- /committees/ --phone --cpu 6
//   npm run perf -- --delay 500       every page held back half a second, like GoDaddy's server
//   npm run perf -- --json out.json    also save the numbers
//
// Per page it reports:
//   load     first paint, largest paint, when the loading screen went, main-thread blocking
//            (time over 50 ms in each long task, the "TBT" of Lighthouse), layout shift
//   idle     main-thread time used per second while nobody touches the page (should be ~0),
//            and how many animations keep running
//   scroll   wheel-scrolling the whole page: frames slower than 1/30 s, the slowest frame, and
//            main-thread time per second
//   size     DOM elements, composited layers, and bytes downloaded
// Then it clicks Home > Committees and Committees > a committee in the nav, and times each
// click until the next page is usable.
//
// In a cloud container with no GPU everything is drawn in software, so absolute numbers are
// worse than on a real laptop; compare runs with each other.
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { serve } from "./lib/serve.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const phone = args.includes("--phone");
const cpu = Number(flag("cpu", 4));
const htmlDelay = Number(flag("delay", 0));
const jsonOut = flag("json", null);
const only = args.filter((a, i) => a.startsWith("/") && !["--json", "--delay", "--cpu"].includes(args[i - 1]));
const PAGES = only.length
  ? only
  : ["/", "/committees/", "/committees/unsc/", "/committees/doomsday/", "/secretariat/", "/social-night/", "/new-to-mun/", "/resources/", "/allocations/", "/qr/"];

const { server, origin } = await serve("_site", 0, { htmlDelay });
const browser = await chromium.launch();
const viewport = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const contextOptions = phone
  ? { viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { viewport, deviceScaleFactor: 1 };

// Collected in the page from the first moment: paints, long tasks, layout shifts, frames.
const probe = () => {
  const p = (window.__perf = { lcp: 0, fcp: 0, cls: 0, long: [], frames: [], loaderGone: 0 });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => (p.lcp = e.startTime))).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => e.name === "first-contentful-paint" && (p.fcp = e.startTime))).observe({ type: "paint", buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (p.cls += e.value))).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => p.long.push([e.startTime, e.duration]))).observe({ type: "longtask", buffered: true });
  addEventListener("loader:done", () => (p.loaderGone = performance.now()));
  try {
    localStorage.setItem("oakjmun-notice", "off");
    sessionStorage.setItem("oakjmun-gallery", "1"); // the homepage intro plays once a session; measure the page itself
  } catch {}
};

const metric = async (cdp) => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
};
const busy = (a, b) => (b.TaskDuration - a.TaskDuration) * 1000; // ms of main-thread work

const results = [];
try {
  for (const url of PAGES) {
    const context = await browser.newContext(contextOptions);
    await context.addInitScript(probe);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    let bytes = 0;
    page.on("response", async (res) => {
      try {
        bytes += Number((await res.headerValue("content-length")) ?? 0) || (await res.body()).length;
      } catch {}
    });

    await page.goto(origin + url, { waitUntil: "load" });
    await page.waitForTimeout(3000);
    const load = await page.evaluate(() => {
      const p = window.__perf;
      const tbt = p.long.reduce((sum, [, d]) => sum + Math.max(0, d - 50), 0);
      return { fcp: p.fcp, lcp: p.lcp, cls: p.cls, tbt, longTasks: p.long.length, loaderGone: p.loaderGone, nodes: document.getElementsByTagName("*").length };
    });

    // Idle: 3 s with nobody touching the page.
    const before = await metric(cdp);
    await page.waitForTimeout(3000);
    const after = await metric(cdp);
    const idle = {
      busyPerSec: busy(before, after) / 3,
      animations: await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
    };

    // Layers
    await cdp.send("LayerTree.enable");
    const layers = await new Promise((resolve) => {
      let last = [];
      cdp.on("LayerTree.layerTreeDidChange", (e) => (last = e.layers ?? last));
      setTimeout(() => resolve(last), 1500);
    });
    await cdp.send("LayerTree.disable");
    const drawn = layers.filter((l) => l.drawsContent);
    const layerArea = drawn.reduce((s, l) => s + l.width * l.height, 0) / (viewport.width * viewport.height);

    // Scroll the whole page with the mouse wheel (Lenis takes over on desktop), then measure
    // frame gaps in the page.
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.evaluate(() => {
      const p = window.__perf;
      p.frames = [];
      p.long = [];
      let last = performance.now();
      const tick = (t) => {
        p.frames.push(t - last);
        last = t;
        if (!p.stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const s0 = await metric(cdp);
    const t0 = Date.now();
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(height, 9000) && Date.now() - t0 < 8000; y += 120) {
      if (phone) await page.evaluate(() => scrollBy(0, 120));
      else await page.mouse.wheel(0, 120);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(600);
    const s1 = await metric(cdp);
    const secs = (Date.now() - t0) / 1000;
    const scroll = await page.evaluate(() => {
      const p = window.__perf;
      p.stop = true;
      const f = p.frames.slice(1);
      return {
        frames: f.length,
        janky: f.filter((d) => d > 34).length,
        worst: Math.max(0, ...f),
        long: p.long.length,
        reached: Math.round(scrollY),
      };
    });
    scroll.busyPerSec = busy(s0, s1) / secs;

    const row = { url, ...load, ...idle, layers: drawn.length, layerArea, bytes, scroll };
    results.push(row);
    console.log(
      `${url.padEnd(22)} FCP ${ms(load.fcp)}  LCP ${ms(load.lcp)}  loader ${load.loaderGone ? ms(load.loaderGone) : "  -  "}  TBT ${ms(load.tbt)}  CLS ${load.cls.toFixed(3)}` +
        ` | idle ${ms(idle.busyPerSec)}/s, ${idle.animations} anims` +
        ` | scroll ${scroll.janky}/${scroll.frames} slow frames, worst ${ms(scroll.worst)}, ${ms(scroll.busyPerSec)}/s busy` +
        ` | ${load.nodes} el, ${drawn.length} layers (${layerArea.toFixed(1)} screens), ${(bytes / 1024).toFixed(0)} KB`,
    );
    await context.close();
  }

  // Clicks between pages, as a visitor does: each timed until the next page is usable (the
  // loading screen gone and the page fully loaded).
  const context = await browser.newContext(contextOptions);
  await context.addInitScript(probe);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  await page.goto(origin + "/", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  for (const [from, selector] of [
    ["/", phone ? null : '.nav a[href="/committees/"]'],
    ["/committees/", 'a.tile[href="/committees/unsc/"]'],
    ["/committees/unsc/", phone ? null : '.nav a[href="/secretariat/"]'],
  ]) {
    if (!selector) continue;
    if (!page.url().endsWith(from)) {
      await page.goto(origin + from, { waitUntil: "load" });
      await page.waitForTimeout(1500);
    }
    // Point at the link for a moment, then press, as a visitor does (page.click would first
    // scroll the page, which on the homepage starts the 3D intro again).
    const box = await page.locator(selector).first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 3 });
    await page.waitForTimeout(400);
    const t = Date.now();
    await Promise.all([page.waitForURL((u) => u.pathname !== from), page.mouse.down().then(() => page.mouse.up())]);
    await page.waitForFunction(() => document.readyState === "complete" && !document.documentElement.classList.contains("is-loading"));
    const shown = Date.now() - t;
    const paint = await page.evaluate(() => window.__perf.fcp);
    console.log(`click ${from} -> ${new URL(page.url()).pathname}: usable after ${shown} ms (first paint ${ms(paint)} after the new page started)`);
    results.push({ click: `${from} -> ${new URL(page.url()).pathname}`, usable: shown, fcp: paint });
    await page.waitForTimeout(1500);
  }
  await context.close();
} finally {
  await browser.close();
  server.close();
}
if (jsonOut) await writeFile(jsonOut, JSON.stringify(results, null, 2));

function ms(v) {
  return `${Math.round(v)} ms`.padStart(7);
}
