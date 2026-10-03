// Entrances as things come on screen, on every page (PLAN.md F11). Only transform and
// opacity change, each element moves once, and nothing runs with reduced motion: the inline
// script in <head> sets html.reveal-on only when motion is fine, and takes it away again if
// this file hasn't started within a few seconds, so nothing can stay hidden.
//
//   data-reveal          the block fades in and rises 28 px
//   data-reveal="mask"   a heading rises out of a mask, line by line as one block
//   data-reveal="art"    a picture or illustration fades in and settles from 106% scale
//
// Elements that come on screen together go one after another, 90 ms apart (a heading, then
// its text, then its content), at most four steps.
//
// Pictures that are still downloading fade in when they arrive, instead of popping in.
const root = document.documentElement;

if (root.classList.contains("reveal-on") && "IntersectionObserver" in window) {
  root.classList.add("reveal-ready");

  const STEP = 90; // ms between elements that arrive together
  const MAX_STEPS = 4;

  // Masked headings: wrap the contents in two elements, so the inner one can rise from below
  // the outer one's edge. They're custom elements rather than spans, so page styles such as
  // ".sec-head__title span" don't catch them. Once the rise is over, the mask comes off (in
  // show) so glows and descenders aren't clipped.
  for (const heading of document.querySelectorAll('[data-reveal="mask"]')) {
    const outer = document.createElement("reveal-mask");
    const inner = document.createElement("reveal-line");
    inner.append(...heading.childNodes);
    outer.append(inner);
    heading.append(outer);
    heading.classList.add("is-masked");
  }

  const show = (el, delay = 0) => {
    if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
    el.classList.add("is-in");
    // After the rise (1.1 s plus the delay), take the mask off. A timer rather than
    // transitionend, which doesn't fire for parts of the page the browser skipped drawing.
    if (el.dataset.reveal === "mask") setTimeout(() => el.classList.add("is-done"), delay + 1200);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      let step = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        show(entry.target, Math.min(step, MAX_STEPS - 1) * STEP);
        step++;
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );

  const start = () => {
    for (const el of document.querySelectorAll("[data-reveal]")) {
      // Anything already scrolled past (a reload partway down, a #link) shows at once.
      if (el.getBoundingClientRect().bottom < 0) {
        el.classList.add("is-in", "is-done");
        continue;
      }
      observer.observe(el);
    }
  };

  // While the loading screen is showing, wait for it, so the first screen's entrances are
  // seen. Otherwise start at once: waiting for every picture would hold the page back.
  if (root.classList.contains("is-slow")) {
    addEventListener("loader:done", start, { once: true });
  } else {
    start();
  }

  // Pictures still on their way fade in when they land.
  for (const img of document.querySelectorAll("main img")) {
    if (img.complete || img.closest(".hero")) continue;
    img.classList.add("img-fade");
    const done = () => img.classList.add("is-loaded");
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  }
}
