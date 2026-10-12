// Animated page backgrounds (11 October, PLAN.md F43): the moving grid on Allocations and
// Resources, adapted from the 21st.dev component "noise-dark-blue-gradient-with-squares" and
// rewritten without React (its moving static is left out: redrawing a million dots a few times a
// second is too much for phones; the page keeps its still look).
//
// It draws only while it's on screen, holds still while the page scrolls (html.is-scrolling,
// from nav.js), and with reduced motion or Save-Data draws one still frame and takes no input.

const root = document.documentElement;
const calm =
  matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData === true;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const css = getComputedStyle(root);

// Calls draw(ms) every frame while the host is on screen and the page isn't scrolling.
function animate(host, draw) {
  if (calm) {
    requestAnimationFrame(() => draw(6000));
    return;
  }
  let raf = 0;
  let inView = false;
  const frame = (now) => {
    raf = 0;
    if (!inView || document.hidden) return;
    if (!root.classList.contains("is-scrolling")) draw(now);
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!raf && inView && !document.hidden) raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    start();
  }).observe(host);
  document.addEventListener("visibilitychange", start);
}

// Matches the canvas to its box, capped in pixel ratio and total pixels. True when it changed.
function fit(canvas, maxPixels, maxRatio = 2) {
  const box = canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, maxRatio);
  let w = Math.max(1, Math.round(box.width * ratio));
  let h = Math.max(1, Math.round(box.height * ratio));
  const scale = Math.min(1, Math.sqrt(maxPixels / (w * h)));
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  return true;
}

/* ---------- Moving grid (Allocations, Resources) ---------- */

// The canvas is the height of the screen and sticks to it while the page scrolls past; the grid
// drifts diagonally and the square under the pointer lights up. On touch screens a tap lights a
// square, and now and then one lights by itself.
function grid(host, canvas) {
  const ctx = canvas.getContext("2d");
  const SIZE = 44;
  const deep = css.getPropertyValue("--blue-950").trim();
  let width = 0;
  let height = 0;
  let offset = 0;
  let last = 0;
  let lit = null; // { x, y } in grid squares, plus when it lit up (touch screens)

  const origin = () => -(((offset % SIZE) + SIZE) % SIZE);
  const square = (clientX, clientY, at = 0) => {
    const box = canvas.getBoundingClientRect();
    if (clientY < box.top || clientY > box.bottom) return null;
    return {
      x: Math.floor((clientX - box.left - origin()) / SIZE),
      y: Math.floor((clientY - box.top - origin()) / SIZE),
      at,
    };
  };

  if (!calm) {
    if (finePointer.matches) {
      addEventListener("pointermove", (event) => (lit = square(event.clientX, event.clientY)), { passive: true });
      document.documentElement.addEventListener("pointerleave", () => (lit = null));
    } else {
      host.addEventListener("pointerdown", (event) => (lit = square(event.clientX, event.clientY, performance.now())));
    }
  }

  animate(host, (now) => {
    const box = canvas.getBoundingClientRect();
    if (box.width !== width || box.height !== height) {
      width = box.width;
      height = box.height;
      fit(canvas, 4_000_000);
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    }
    const dt = last ? Math.min(now - last, 100) : 0;
    last = now;
    offset += dt * 0.036; // 0.6 px a frame at 60 fps, as in the original
    const o = origin();

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = o; x < width + SIZE; x += SIZE) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = o; y < height + SIZE; y += SIZE) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();

    const vignette = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.hypot(width, height) / 2);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, deep);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Touch screens: a square lights by itself every couple of seconds.
    if (!finePointer.matches && !calm && (!lit || now - lit.at > 2200)) {
      lit = { x: Math.floor(Math.random() * (width / SIZE)), y: Math.floor(Math.random() * (height / SIZE)), at: now };
    }
    if (!lit) return;
    const fade = lit.at ? Math.max(0, 1 - (now - lit.at) / 1600) : 1;
    if (fade <= 0) return;
    const x = o + lit.x * SIZE;
    const y = o + lit.y * SIZE;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(37,99,235,0.45)";
    ctx.fillStyle = "rgba(37,99,235,0.12)";
    ctx.fillRect(x, y, SIZE, SIZE);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.strokeRect(x + 0.5, y + 0.5, SIZE - 1, SIZE - 1);
    const sheen = ctx.createLinearGradient(x, y, x, y + SIZE);
    sheen.addColorStop(0, "rgba(255,255,255,0.2)");
    sheen.addColorStop(1, "rgba(255,255,255,0.05)");
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, SIZE, SIZE);
    ctx.restore();
  });
}

const effects = { grid };
for (const host of document.querySelectorAll("[data-backdrop]")) {
  const canvas = host.querySelector("canvas");
  const run = effects[host.dataset.backdrop];
  if (canvas && run) run(host.closest("[data-backdrop-host]") ?? host.parentElement, canvas);
}
