// "Committees at a glance" wheel (SPEC 9.1, item 8). Items sit on an arc as in OakMUN
// (x = R(1 - cos φ), y = R sin φ) and turn continuously, about one committee a second, as
// OakMUN's do. Scrolling the page turns it further: down moves it on, up turns it back.
// It stops while the pointer is over it and while a link inside has keyboard focus (focusing
// a link turns that committee to the front), and doesn't run off-screen or in a hidden tab.
// Only transform and opacity change. With reduced motion it stays a plain list.
const wheel = document.querySelector("[data-wheel]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (wheel && !calm && "IntersectionObserver" in window) {
  const SPEED = 0.9; // committees per second while it turns by itself
  const SCROLL_STEP = 160; // px of page scroll that turn it by one committee
  const EASE = 0.09; // how quickly the drawn position catches up, per 60 fps frame
  const items = [...wheel.querySelectorAll(".wheel__item")];
  const n = items.length;
  let target = 0; // where the wheel is heading, in committees
  let shown = 0; // where it's drawn
  let frame = 0;
  let last = 0;
  let onScreen = false;
  let hovering = false;
  let focused = false;
  let lastScroll = scrollY;
  let radius = 280;

  const measure = () => {
    radius = parseFloat(getComputedStyle(wheel).getPropertyValue("--wheel-r")) || 280;
  };

  const draw = () => {
    items.forEach((item, i) => {
      let k = (((i - shown) % n) + n) % n;
      if (k > n / 2) k -= n;
      const phi = (k * 2 * Math.PI) / n;
      const c = Math.cos(phi);
      const x = radius * (1 - c);
      const y = radius * Math.sin(phi);
      const scale = 0.72 + (0.28 * (c + 1)) / 2;
      // Steeper than OakMUN's (c + 0.6) / 1.6, so only the front item and two either side
      // show, as in reference/08, and the ones behind don't overlap them.
      const opacity = Math.min(1, Math.max(0, (c - 0.2) / 0.8));
      item.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      item.style.opacity = opacity.toFixed(3);
    });
  };

  const paused = () => hovering || focused;

  const tick = (now) => {
    const dt = last ? Math.min(now - last, 64) : 16.7;
    last = now;
    if (!paused()) target += (SPEED * dt) / 1000;
    shown += (target - shown) * (1 - Math.pow(1 - EASE, dt / 16.7));
    draw();
    // Once it has come to rest under the pointer or focus, stop drawing until something changes.
    if (paused() && Math.abs(target - shown) < 0.0005) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const sync = () => {
    const run = onScreen && !document.hidden;
    if (run && !frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
    if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  // Turn the shortest way round to bring item `index` to the front.
  const bringToFront = (index) => {
    let delta = (((index - shown) % n) + n) % n;
    if (delta > n / 2) delta -= n;
    target = shown + delta;
    sync();
  };

  measure();
  wheel.classList.add("is-wheel");
  draw();

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    lastScroll = scrollY;
    sync();
  }).observe(wheel);

  addEventListener(
    "scroll",
    () => {
      const y = scrollY;
      if (onScreen && !paused()) {
        target += (y - lastScroll) / SCROLL_STEP;
        sync();
      }
      lastScroll = y;
    },
    { passive: true },
  );

  wheel.addEventListener("pointerenter", () => {
    hovering = true;
  });
  wheel.addEventListener("pointerleave", () => {
    hovering = false;
    sync();
  });
  wheel.addEventListener("focusin", (event) => {
    focused = true;
    const index = items.findIndex((item) => item.contains(event.target));
    if (index !== -1) bringToFront(index);
  });
  wheel.addEventListener("focusout", (event) => {
    if (wheel.contains(event.relatedTarget)) return;
    focused = false;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  matchMedia("(max-width: 768px)").addEventListener("change", () => {
    measure();
    draw();
  });
}
