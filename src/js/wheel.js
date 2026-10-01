// "Committees at a glance" wheel (SPEC 9.1, item 8). Items sit on an arc as in OakMUN
// (x = R(1 - cos φ), y = R sin φ) and step to the next committee every 2.2 s (PLAN.md D3).
// Faded-out items stay focusable: tabbing to one brings it to the front, so the keyboard
// walks through all the committees in order.
// It pauses on hover, on keyboard focus, off-screen and in a hidden tab. Focusing a link
// brings that committee to the front. With reduced motion it stays a plain list.
const wheel = document.querySelector("[data-wheel]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (wheel && !calm && "IntersectionObserver" in window) {
  const STEP = 2200;
  const items = [...wheel.querySelectorAll(".wheel__item")];
  const n = items.length;
  let current = 0;
  let timer = 0;
  let onScreen = false;
  let hovering = false;
  let focused = false;

  const layout = () => {
    const r = parseFloat(getComputedStyle(wheel).getPropertyValue("--wheel-r")) || 280;
    items.forEach((item, i) => {
      let k = (((i - current) % n) + n) % n;
      if (k > n / 2) k -= n;
      const phi = (k * 2 * Math.PI) / n;
      const c = Math.cos(phi);
      const x = r * (1 - c);
      const y = r * Math.sin(phi);
      const scale = 0.72 + (0.28 * (c + 1)) / 2;
      // Steeper than OakMUN's (c + 0.6) / 1.6, so only the front item and two either side
      // show, as in reference/08, and the ones behind don't overlap them.
      const opacity = Math.min(1, Math.max(0, (c - 0.2) / 0.8));
      item.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      item.style.opacity = opacity.toFixed(3);
    });
  };

  const advance = () => {
    current = (current + 1) % n;
    layout();
  };

  const sync = () => {
    const run = onScreen && !hovering && !focused && !document.hidden;
    if (run && !timer) timer = setInterval(advance, STEP);
    if (!run && timer) {
      clearInterval(timer);
      timer = 0;
    }
  };

  // Place everything without animating from the plain-list positions.
  wheel.classList.add("is-wheel", "no-anim");
  layout();
  requestAnimationFrame(() => requestAnimationFrame(() => wheel.classList.remove("no-anim")));

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  }).observe(wheel);

  wheel.addEventListener("pointerenter", () => {
    hovering = true;
    sync();
  });
  wheel.addEventListener("pointerleave", () => {
    hovering = false;
    sync();
  });
  wheel.addEventListener("focusin", (event) => {
    focused = true;
    const index = items.findIndex((item) => item.contains(event.target));
    if (index !== -1 && index !== current) {
      current = index;
      layout();
    }
    sync();
  });
  wheel.addEventListener("focusout", (event) => {
    if (wheel.contains(event.relatedTarget)) return;
    focused = false;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  matchMedia("(max-width: 768px)").addEventListener("change", layout);
}
