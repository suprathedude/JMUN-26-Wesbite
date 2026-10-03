// Homepage opening (PLAN.md F14): a crowd holding up country placards stands in front of the
// title, like a committee room at a vote. Scrolling moves the rows down and apart, front row
// fastest, until the title, dates and buttons are clear; scrolling back up brings them back.
// The hero stays on screen (sticky) while the page scrolls the length of its track.
//
// The crowd is built here from site.json intro.countries. Only transform and opacity change,
// once per frame and only while the hero is on screen. html.hero-scroll is set in <head>
// unless motion is reduced; without it the hero is the plain one and this does nothing.
const root = document.documentElement;
const track = document.querySelector("[data-hero-track]");
const crowd = document.querySelector("[data-crowd]");

// Rows from the back of the room to the front. top: where the row's placards start, as a share
// of the screen's height. speed: how far it sinks by the end, in screen heights. spread: how
// far the people part sideways, as a share of their distance from the middle.
const LAYOUT = {
  desktop: [
    { name: "back", count: 9, scale: 0.7, top: 0.28, speed: 0.82, spread: 0.16 },
    { name: "mid", count: 8, scale: 0.86, top: 0.38, speed: 0.92, spread: 0.26 },
    { name: "front", count: 6, scale: 1.06, top: 0.5, speed: 1.08, spread: 0.38 },
  ],
  phone: [
    { name: "back", count: 5, scale: 0.8, top: 0.33, speed: 0.86, spread: 0.22 },
    { name: "front", count: 4, scale: 1.02, top: 0.47, speed: 1.08, spread: 0.34 },
  ],
};
const DONE = 0.72; // share of the track's scroll by which the crowd has gone

// A person: placard overhead on its handle, both hands holding the handle, head between the
// arms, shoulders and a body that runs off the bottom of the screen.
const BODY =
  '<svg class="fig__body" viewBox="0 0 100 360" aria-hidden="true" focusable="false">' +
  '<path d="M4 360V122c0-24 20-36 46-36s46 12 46 36v238z"/>' +
  '<circle cx="50" cy="62" r="17"/>' +
  '<path d="M18 104C8 68 26 32 44 9M82 104C92 68 74 32 56 9" fill="none" stroke-width="12" stroke-linecap="round"/>' +
  "</svg>";

// Small seeded random generator, so the room looks the same on every visit.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function person(name) {
  const fig = document.createElement("div");
  fig.className = "fig";
  const size = name.length > 13 ? " placard--longer" : name.length > 9 ? " placard--long" : "";
  fig.innerHTML =
    `<div class="fig__lift"><div class="placard${size}"><span class="placard__face">` +
    `<span class="placard__name"></span></span><span class="placard__handle"></span></div>${BODY}</div>`;
  fig.querySelector(".placard__name").textContent = name;
  return fig;
}

if (track && crowd && root.classList.contains("hero-scroll")) {
  const hero = track.querySelector(".hero");
  const title = hero.querySelector(".hero__title");
  const later = [...hero.querySelectorAll(".hero__meta, .hero__actions, .countdown")];
  const cue = hero.querySelector(".hero__cue");
  const mark = hero.querySelector(".hero__watermark");
  let countries = [];
  try {
    countries = JSON.parse(crowd.dataset.countries || "[]");
  } catch {}
  if (countries.length === 0) countries = ["TBC"];

  const clamp = (v) => Math.min(1, Math.max(0, v));
  let rows = [];
  let range = 1;
  let frame = 0;
  let onScreen = true;

  const build = () => {
    const phone = matchMedia("(max-width: 768px)").matches;
    const base = phone ? 11.43 : 16; // the placard's own size (components.css)
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    const random = seeded(14);
    const pool = [...countries].sort(() => random() - 0.5);
    let next = 0;
    crowd.textContent = "";
    rows = LAYOUT[phone ? "phone" : "desktop"].map((spec) => {
      const row = document.createElement("div");
      row.className = `crowd__row crowd__row--${spec.name}`;
      const size = base * spec.scale;
      row.style.fontSize = `${size}px`;
      row.style.top = `${spec.top * h}px`;
      const slot = w / spec.count;
      const figs = [];
      for (let i = 0; i < spec.count; i++) {
        const cx = slot * (i + 0.5) + (random() - 0.5) * slot * 0.35;
        const fig = person(pool[next++ % pool.length]);
        fig.style.left = `${cx - 5.25 * size}px`;
        fig.style.top = `${(random() - 0.5) * size * 1.4}px`;
        fig.style.setProperty("--bob", `${(2.6 + random() * 1.4).toFixed(2)}s`);
        fig.style.setProperty("--delay", `${(-random() * 3).toFixed(2)}s`);
        figs.push({ fig, dx: cx - w / 2, tilt: (random() - 0.5) * 7 });
        row.append(fig);
      }
      crowd.append(row);
      return { ...spec, row, figs, h };
    });
    range = Math.max(1, track.offsetHeight - hero.offsetHeight);
  };

  const update = () => {
    frame = 0;
    const p = clamp(-track.getBoundingClientRect().top / range);
    // The crowd: slow to start, like people deciding to sit down, then out of the way.
    const t = Math.pow(clamp(p / DONE), 1.35);
    for (const r of rows) {
      r.row.style.transform = `translate3d(0, ${(t * r.h * r.speed).toFixed(1)}px, 0)`;
      for (const f of r.figs) {
        const lean = f.tilt + Math.sign(f.dx) * 9 * t;
        f.fig.style.transform = `translate3d(${(f.dx * r.spread * t).toFixed(1)}px, 0, 0) rotate(${lean.toFixed(2)}deg)`;
      }
    }
    // The title comes up through the gaps, then the dates, buttons and countdown follow.
    const up = clamp((p - 0.04) / 0.5);
    const ease = 1 - Math.pow(1 - up, 3);
    title.style.opacity = (0.25 + 0.75 * ease).toFixed(3);
    title.style.transform = `scale(${(0.94 + 0.06 * ease).toFixed(4)})`;
    mark.style.transform = `scale(${(1.08 - 0.08 * ease).toFixed(4)})`;
    const rest = clamp((p - 0.4) / 0.28);
    for (const el of later) {
      el.style.opacity = rest.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - rest) * 18).toFixed(1)}px, 0)`;
    }
    cue.style.opacity = (1 - clamp(p / 0.1)).toFixed(3);
    crowd.classList.toggle("is-still", p > 0.02 || !onScreen);
  };

  const request = () => {
    if (!frame && onScreen) frame = requestAnimationFrame(update);
  };

  build();
  update();
  root.classList.add("hero-live");

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    crowd.classList.toggle("is-still", !onScreen);
    request();
  }).observe(track);
  addEventListener("scroll", request, { passive: true });

  // Rebuild when the width changes (not when a phone's address bar slides in and out).
  let resizing = 0;
  let width = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === width) return;
    width = innerWidth;
    clearTimeout(resizing);
    resizing = setTimeout(() => {
      build();
      update();
    }, 150);
  });

  // Keyboard: tabbing to the hero's buttons scrolls to where they're fully shown.
  hero.addEventListener("focusin", () => {
    const top = track.getBoundingClientRect().top + scrollY;
    if (scrollY - top < range * 0.75) scrollTo(0, top + range * 0.75);
  });
}
