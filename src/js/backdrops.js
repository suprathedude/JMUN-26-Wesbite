// Animated page backgrounds (11 October, PLAN.md F43): the moving grid on Allocations and
// Resources, adapted from the 21st.dev component "noise-dark-blue-gradient-with-squares" and
// rewritten without React (its moving static is left out: too much for phones).
//
// The grid's lines, its drift and the dark edges are CSS (components.css, "Backdrops"), moved by
// the graphics chip (16 October: it was a canvas redrawn every frame, a second of work each
// second on a slowed laptop). This file only lights the square under the pointer; on touch
// screens a tap lights a square, and now and then one lights by itself. With reduced motion or
// Save-Data the grid holds still and takes no input.

const SIZE = 44; // px, one grid square (--grid-size in components.css)
const calm =
  matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData === true;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

function grid(backdrop) {
  const layer = backdrop.querySelector("[data-grid-drift]");
  const lit = backdrop.querySelector("[data-grid-lit]");
  if (calm) {
    backdrop.classList.add("is-calm");
    return;
  }
  if (!layer || !lit) return;

  // The square under (x, y) on screen, in the drifting grid's own coordinates.
  let cell = "";
  const light = (clientX, clientY) => {
    const box = layer.getBoundingClientRect();
    const x = Math.floor((clientX - box.left) / SIZE) * SIZE;
    const y = Math.floor((clientY - box.top) / SIZE) * SIZE;
    if (`${x},${y}` === cell) return false;
    cell = `${x},${y}`;
    lit.style.transform = `translate(${x}px, ${y}px)`;
    return true;
  };

  if (finePointer.matches) {
    let queued = null;
    addEventListener(
      "pointermove",
      (event) => {
        if (!queued) requestAnimationFrame(() => {
          light(queued.clientX, queued.clientY);
          lit.classList.add("is-on");
          queued = null;
        });
        queued = event;
      },
      { passive: true },
    );
    document.documentElement.addEventListener("pointerleave", () => {
      lit.classList.remove("is-on");
      cell = "";
    });
    return;
  }

  // Touch screens: the square fades out over 1.6 s.
  const flash = (clientX, clientY) => {
    light(clientX, clientY);
    cell = "";
    lit.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1600, easing: "linear", fill: "forwards" });
  };
  backdrop.parentElement.addEventListener("pointerdown", (event) => flash(event.clientX, event.clientY));
  let inView = false;
  new IntersectionObserver(([entry]) => (inView = entry.isIntersecting)).observe(backdrop);
  setInterval(() => {
    if (!inView || document.hidden) return;
    flash(Math.random() * innerWidth, Math.random() * innerHeight);
  }, 2200);
}

for (const backdrop of document.querySelectorAll('[data-backdrop="grid"]')) grid(backdrop);
