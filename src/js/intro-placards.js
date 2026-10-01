// Homepage intro, "placards rising" (SPEC 10). The page opens like a committee room at a
// vote: placards go up across the room, then part to reveal the title.
//
// It only runs when the inline script in <head> has set html.intro (first visit this
// session, no reduced motion, no #section, no ?intro=off). DOM elements and the Web
// Animations API only, transform and opacity only. Scrolling is never blocked: any click,
// tap, key, wheel or touch move jumps straight to the final state.

const root = document.documentElement;
const hero = document.querySelector(".hero");
const layer = document.querySelector("[data-intro]");

const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_STANDARD = "cubic-bezier(0.4, 0, 0.2, 1)";
const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchmove"];

// Desktop timeline in ms (SPEC 10). Phones run the same sequence compressed to about 1.6 s.
const TIMELINE = { riseStart: 150, riseDur: 700, riseEnd: 1250, bob: 1400, holdEnd: 1550, exitEnd: 2150, end: 2500 };

// Three depth rows on desktop, two on phones (SPEC 10). baseline: the row's desk line as a
// share of the hero's height. margin: side margin as a share of the width; a negative one
// lets the row run past the screen edges, like a room that's wider than the view.
const ROWS = {
  desktop: [
    { count: 8, scale: 0.7, opacity: 0.55, baseline: 0.47, margin: 0.03, offset: 0 },
    { count: 7, scale: 0.85, opacity: 0.8, baseline: 0.62, margin: 0.07, offset: 30 },
    { count: 5, scale: 1, opacity: 1, baseline: 0.8, margin: 0.04, offset: 60 },
  ],
  phone: [
    { count: 4, scale: 0.85, opacity: 0.8, baseline: 0.5, margin: -0.08, offset: 0 },
    { count: 4, scale: 1, opacity: 1, baseline: 0.66, margin: -0.03, offset: 30 },
  ],
};
const MIN_GAP = 12; // px between neighbours in a row, when there's room for one

// Small seeded random generator, so the room looks the same on every visit.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPlacard(name) {
  const el = document.createElement("div");
  el.className = "placard" + (name.length > 13 ? " placard--longer" : name.length > 9 ? " placard--long" : "");
  const face = document.createElement("span");
  face.className = "placard__face";
  const label = document.createElement("span");
  label.className = "placard__name";
  label.textContent = name;
  face.append(label);
  const handle = document.createElement("span");
  handle.className = "placard__handle";
  el.append(face, handle);
  return el;
}

function run() {
  try {
    sessionStorage.setItem("oakjmun-intro", "1");
  } catch {
    // Storage blocked: the head script won't have started the intro anyway.
  }

  const phone = matchMedia("(max-width: 768px)").matches;
  const k = phone ? 0.64 : 1;
  const t = Object.fromEntries(Object.entries(TIMELINE).map(([key, ms]) => [key, ms * k]));
  const rows = phone ? ROWS.phone : ROWS.desktop;
  const random = seeded(14);
  const box = hero.getBoundingClientRect();
  const width = box.width;
  const base = phone ? 11.43 : 16; // placard font-size, px

  let countries = [];
  try {
    countries = JSON.parse(layer.dataset.countries || "[]");
  } catch {
    countries = [];
  }
  if (countries.length === 0) countries = ["TBC"];
  const pool = [...countries].sort(() => random() - 0.5);

  const animations = [];
  const placards = [];
  let n = 0;

  rows.forEach((row, r) => {
    const size = base * row.scale;
    const faceH = 3.25 * size;
    const total = faceH + 1.125 * size;
    const headroom = 14; // so a tilted or bobbing placard isn't clipped at the top
    const rowEl = document.createElement("div");
    rowEl.className = "intro-row";
    rowEl.style.top = `${box.height * row.baseline - total - headroom}px`;
    rowEl.style.height = `${total + headroom}px`;
    layer.append(rowEl);

    // Spread evenly, then nudge each placard a little so the room doesn't look like a grid.
    // The nudge never brings neighbours closer than MIN_GAP.
    const margin = width * row.margin;
    const step = (width - 2 * margin) / row.count;
    const placardW = 10.5 * size;
    const room = Math.max(0, step - placardW - MIN_GAP);

    // Irregular order: shuffle who rises when, 35 to 60 ms apart, scaled to finish by riseEnd.
    const order = [...Array(row.count).keys()].sort(() => random() - 0.5);
    const gaps = order.map(() => (35 + random() * 25) * k);
    const start = t.riseStart + row.offset * k;
    const span = gaps.slice(1).reduce((a, b) => a + b, 0);
    const fit = Math.min(1, (t.riseEnd - t.riseDur - start) / Math.max(span, 1));
    let clock = start;
    const delays = [];
    order.forEach((index, i) => {
      if (i > 0) clock += gaps[i] * fit;
      delays[index] = clock;
    });

    for (let i = 0; i < row.count; i++) {
      const name = pool[n++ % pool.length];
      const el = buildPlacard(name);
      const centre = margin + step * (i + 0.5) + (random() - 0.5) * room;
      el.style.left = `${centre - placardW / 2}px`;
      el.style.fontSize = `${size}px`; // the row's depth: placards are sized in em
      el.style.zIndex = String(r + 1);
      el.style.willChange = "transform, opacity";
      rowEl.append(el);
      placards.push(el);

      const delay = delays[i];
      const duration = t.exitEnd - delay;
      const at = (ms) => Math.min(1, Math.max(0, (ms - delay) / duration));
      const tiltFrom = (random() * 14 - 7).toFixed(1);
      const tilt = (random() * 4 - 2).toFixed(1);
      const fromCentre = centre - width / 2;
      const nearCentre = Math.abs(fromCentre) < width * 0.28;
      const side = fromCentre < 0 ? -1 : 1;
      const exit = nearCentre
        ? `translate(${(side * (45 + random() * 20)).toFixed(1)}vw, 0) rotate(${(+tilt + side * 4).toFixed(1)}deg)`
        : `translate(0, 110%) rotate(${tilt}deg)`;
      const up = `translate(0, 0) rotate(${tilt}deg)`;

      animations.push(
        el.animate(
          [
            { offset: 0, transform: `translate(0, 110%) rotate(${tiltFrom}deg)`, opacity: row.opacity, easing: EASE_OUT_EXPO },
            { offset: at(delay + t.riseDur), transform: up, opacity: row.opacity, easing: "linear" },
            { offset: at(t.riseEnd), transform: up, opacity: row.opacity, easing: "ease-in-out" },
            { offset: at(t.bob), transform: `translate(0, -2px) rotate(${tilt}deg)`, opacity: row.opacity, easing: "ease-in-out" },
            { offset: at(t.holdEnd), transform: up, opacity: row.opacity, easing: EASE_STANDARD },
            { offset: 1, transform: exit, opacity: 0 },
          ],
          { delay, duration, fill: "both" },
        ),
      );
    }
  });

  // The navy wash lifts while the placards part.
  const wash = layer.querySelector(".intro-wash");
  animations.push(
    wash.animate([{ opacity: 1 }, { opacity: 1, offset: t.holdEnd / t.exitEnd }, { opacity: 0 }], {
      duration: t.exitEnd,
      fill: "both",
    }),
  );

  // The title comes in as the placards leave, then the rest. (The XIV watermark simply stays
  // put under the wash: fading a full-screen layer cost frames for no visible gain.)
  const title = hero.querySelector(".hero__title");
  const rest = [...hero.querySelectorAll(".hero__meta, .hero__actions, .countdown")];
  const content = [title, ...rest];
  for (const el of content) el.style.willChange = "transform, opacity";

  const contentAnimations = [
    title.animate([{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "scale(1)" }], {
      delay: t.holdEnd,
      duration: t.exitEnd - t.holdEnd,
      easing: EASE_OUT_EXPO,
      fill: "both",
    }),
    ...rest.map((el) =>
      el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], {
        delay: t.exitEnd,
        duration: t.end - t.exitEnd,
        easing: EASE_OUT_EXPO,
        fill: "both",
      }),
    ),
  ];
  animations.push(...contentAnimations);

  // From here the animations hold everything hidden, so the CSS hiding can go.
  root.classList.replace("intro", "intro-running");
  performance.mark("intro-start"); // for scripts/frames.mjs --mark intro

  let done = false;
  const skip = () => {
    for (const a of animations) a.finish();
  };
  const cleanup = () => {
    if (done) return;
    done = true;
    for (const type of SKIP_EVENTS) window.removeEventListener(type, skip);
    for (const a of contentAnimations) a.cancel(); // hand the final state back to the CSS
    for (const el of content) el.style.willChange = "";
    for (const el of placards) el.style.willChange = "";
    layer.querySelectorAll(".intro-row").forEach((row) => row.remove());
    root.classList.remove("intro-running");
    performance.mark("intro-end");
  };

  for (const type of SKIP_EVENTS) window.addEventListener(type, skip, { once: true, passive: true });
  Promise.all(animations.map((a) => a.finished)).then(cleanup, cleanup);
}

if (root.classList.contains("intro")) {
  // Without the Web Animations API, or if the page reopened partway down, show it as it is.
  if (!hero || !layer || !("animate" in Element.prototype) || window.scrollY > 40) {
    root.classList.remove("intro");
  } else {
    run();
  }
}
