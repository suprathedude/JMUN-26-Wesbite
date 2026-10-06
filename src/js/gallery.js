// Homepage gallery intro (6 October). On the first homepage visit of a session the page opens
// on photos flying out of the dark: a React + Three.js island (src/islands/hero-gallery.tsx,
// bundled to /js/hero-gallery.js), loaded from here only when it will play.
//
// The gallery and the hero share a stage that stays put while the page scrolls through
// site.gallery.screens screens. Scrolling moves the photos; left idle they keep drifting, but
// only scrolling reveals the hero. Over the last part the photos fade and rush past while the
// hero's lines rise in, one after another; scrolling back up plays it backwards. While the
// gallery shows, the nav stays compact (html.gallery-active, nav.js) and a small "Scroll" cue
// sits at the bottom.
//
// The head script sets html.gallery-on before the first paint, and gallery-skip on later
// visits in the session (or with a #section), which start at the hero. Without WebGL, or if
// the island fails to load, the gallery is switched off and the page starts at the hero.
// Only transform and opacity change.
const root = document.documentElement;
const track = document.querySelector("[data-gallery-track]");
const stage = track?.querySelector("[data-gallery-stage]");
const layer = track?.querySelector("[data-gallery]");
const mountEl = layer?.querySelector("[data-gallery-root]");
const cue = layer?.querySelector("[data-gallery-cue]");

const HANDOVER = 0.7; // share of the scroll where the hero starts taking over
const SESSION_KEY = "oakjmun-gallery";

const clamp = (n) => Math.min(1, Math.max(0, n));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const webgl = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

if (track && stage && layer && mountEl && root.classList.contains("gallery-on")) {
  root.classList.add("gallery-ready");
  if (webgl()) start();
  else switchOff();
}

function switchOff() {
  root.classList.remove("gallery-on", "gallery-skip", "gallery-active");
  delete root.dataset.galleryEnd;
  for (const el of document.querySelectorAll(".hero__content > *")) {
    el.style.opacity = "";
    el.style.transform = "";
  }
  dispatchEvent(new Event("gallery:state"));
}

function start() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage blocked: the gallery simply plays on every visit.
  }

  const content = [...stage.querySelectorAll(".hero__content > *")];
  let images = [];
  try {
    // Relative to the page, so the paths work wherever the site is served from.
    images = JSON.parse(layer.dataset.images).map((src) => ({ src: new URL(src, document.baseURI).href, alt: "" }));
  } catch {
    images = [];
  }
  if (images.length === 0) {
    switchOff();
    return;
  }

  let top = 0;
  let run = 1;
  let loading = null;
  let paused = null;
  let active = null;
  let frame = 0;
  let lastY = scrollY;
  const measure = () => {
    top = track.getBoundingClientRect().top + scrollY;
    run = Math.max(1, track.offsetHeight - stage.offsetHeight);
    // Where the hero is fully in: nav.js treats this as the top of the page.
    root.dataset.galleryEnd = String(Math.round(top + run));
  };
  measure();

  // Later visits start at the hero, with the gallery just above. This waits for the page to
  // load, after the browser has put a reloaded page back where it was, and only jumps if that
  // is still in the gallery.
  let skipping = root.classList.contains("gallery-skip");
  const resolveSkip = () => {
    measure();
    if (!location.hash && scrollY < top + run) scrollTo({ top: top + run, behavior: "instant" });
    lastY = scrollY;
    skipping = false;
    root.classList.remove("gallery-skip");
    render();
  };


  // The island is only fetched when the gallery is about to be seen.
  const load = () => {
    loading ??= import(new URL(layer.dataset.bundle, document.baseURI).href)
      .then(({ mount }) => mount(mountEl, images, paused === true))
      .catch(() => {
        const y = scrollY;
        switchOff();
        if (y > 0) scrollTo({ top: 0, behavior: "instant" });
      });
  };

  const render = () => {
    frame = 0;
    const y = scrollY;
    const p = clamp((y - top) / run);
    const t = clamp((p - HANDOVER) / (1 - HANDOVER));
    const out = easeOut(t);

    // The photos fade and rush past...
    layer.style.opacity = String(1 - out);
    layer.style.transform = out > 0 ? `scale(${(1 + 0.18 * out).toFixed(4)})` : "";
    layer.style.visibility = t >= 1 ? "hidden" : "";
    cue.style.opacity = String(clamp(1 - p / 0.06));

    // ...while the hero's lines rise in, one after another.
    content.forEach((el, i) => {
      const u = easeOut(clamp((t - 0.3 - i * 0.08) / 0.5));
      el.style.opacity = u >= 1 ? "" : String(u);
      el.style.transform = u >= 1 ? "" : `translateY(${((1 - u) * 32).toFixed(1)}px)`;
    });

    const nowActive = p < 0.98;
    if (nowActive !== active) {
      active = nowActive;
      root.classList.toggle("gallery-active", active);
      dispatchEvent(new Event("gallery:state"));
    }

    // Nothing to draw once the hero has taken over.
    const nowPaused = t >= 1;
    if (nowPaused !== paused) {
      paused = nowPaused;
      mountEl.dispatchEvent(new CustomEvent("gallery:pause", { detail: paused }));
      if (!paused) load();
    }
  };

  addEventListener(
    "scroll",
    () => {
      const y = scrollY;
      const delta = y - lastY;
      lastY = y;
      if (skipping) return;
      if (delta && y < top + run) mountEl.dispatchEvent(new CustomEvent("gallery:scroll", { detail: delta }));
      if (!frame) frame = requestAnimationFrame(render);
    },
    { passive: true },
  );
  addEventListener("resize", () => {
    measure();
    if (!skipping) render();
  });

  if (!skipping) render();
  else if (document.readyState === "complete") requestAnimationFrame(resolveSkip);
  else addEventListener("load", () => requestAnimationFrame(resolveSkip), { once: true });
}
