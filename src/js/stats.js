// Stat numbers count up once, the first time they come into view (SPEC 9.1, item 5).
// The final values are already in the HTML, so nothing is lost without JS.
const numbers = document.querySelectorAll("[data-count]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (numbers.length && !calm && "IntersectionObserver" in window) {
  const DURATION = 1600;
  const easeOut = (t) => 1 - (1 - t) ** 3;

  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? "";
    const startedAt = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - startedAt) / DURATION);
      el.textContent = Math.round(target * easeOut(p)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        countUp(entry.target);
      }
    },
    { threshold: 0.5 },
  );

  for (const el of numbers) {
    el.textContent = "0" + (el.dataset.suffix ?? "");
    observer.observe(el);
  }
}
