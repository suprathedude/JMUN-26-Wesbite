// Frame timing on a throttled profile, from a Chrome performance trace (SPEC 10 and Task 7).
// Builds nothing: run `npm run build` first.
//
//   node scripts/frames.mjs / --scroll .glance            the committee ring, desktop
//   node scripts/frames.mjs / --scroll .glance --phone    the same on a 390 x 844 phone
//   node scripts/frames.mjs /social-night/ --phone --from 1000 --to 5000
//
// Options: --phone; --runs N (default 3); --cpu N (CPU slowdown, default 4);
// --mark NAME measures between the page's performance marks NAME-start and NAME-end;
// otherwise --from MS and --to MS set the window after navigation (default 150 to 2700);
// --scroll SELECTOR scrolls that element into view first.
//
// It counts frames Chrome presented and dropped in the window. In a cloud container with no
// GPU, everything is drawn in software, so a real phone does better than these numbers.
import { chromium } from "playwright";
import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { serve } from "./lib/serve.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const url = args.find((a) => a.startsWith("/")) ?? "/";
const phone = args.includes("--phone");
const runs = Number(flag("runs", 3));
const from = Number(flag("from", 150));
const to = Number(flag("to", 2700));
const cpu = Number(flag("cpu", 4));
const scroll = flag("scroll", null);
const mark = flag("mark", null);

const { server, origin } = await serve("_site");
const browser = await chromium.launch();
const tracePath = path.join(os.tmpdir(), `frames-${process.pid}.json`);

try {
  for (let run = 1; run <= runs; run++) {
    const context = await browser.newContext(
      phone
        ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
        : { viewport: { width: 1440, height: 900 } },
    );
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await page.addInitScript(() => performance.mark("frames-nav"));

    await browser.startTracing(page, {
      path: tracePath,
      categories: ["benchmark", "cc", "disabled-by-default-devtools.timeline.frame", "blink.user_timing"],
    });
    await page.goto(origin + url);
    if (scroll) await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: "start" }), scroll);
    await page.waitForTimeout(to + 300);
    await browser.stopTracing();

    const raw = JSON.parse(await readFile(tracePath, "utf8"));
    const events = raw.traceEvents ?? raw;
    const at = (name) => events.find((e) => e.name === name)?.ts;
    const nav = at("frames-nav") ?? events[0].ts;
    const start = mark ? at(`${mark}-start`) : nav + from * 1000;
    const end = mark ? at(`${mark}-end`) : nav + to * 1000;
    if (start === undefined || end === undefined) {
      console.log(`run ${run}: no "${mark}-start" / "${mark}-end" marks (did it play?)`);
      await context.close();
      continue;
    }
    const frames = events.filter((e) => e.name === "PipelineReporter" && e.ph === "b" && e.ts >= start && e.ts <= end);
    const count = (state) => frames.filter((f) => f.args?.frame_reporter?.state === state).length;
    const shown = count("STATE_PRESENTED_ALL") + count("STATE_PRESENTED_PARTIAL");
    const dropped = count("STATE_DROPPED");
    const dropTimes = frames
      .filter((f) => f.args?.frame_reporter?.state === "STATE_DROPPED")
      .map((f) => Math.round((f.ts - start) / 1000));
    console.log(
      `run ${run}: ${Math.round((end - start) / 1000)} ms, ${shown} frames presented, ${dropped} dropped` +
        ` (${((100 * dropped) / Math.max(1, shown + dropped)).toFixed(1)}%)` +
        (dropTimes.length ? `, dropped at ${dropTimes.join(", ")} ms into the window` : ""),
    );
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
  await rm(tracePath, { force: true });
}
