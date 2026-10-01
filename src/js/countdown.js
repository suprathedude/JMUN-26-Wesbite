// Hero countdown to the conference start (SPEC 8.5). Updates once a second, only touching
// digits that change; screen readers get the fixed label on the container instead.
const el = document.querySelector("[data-countdown]");

if (el) {
  const start = Date.parse(el.dataset.start);
  const end = Date.parse(el.dataset.end);
  const units = Object.fromEntries([...el.querySelectorAll("[data-unit]")].map((u) => [u.dataset.unit, u]));
  const status = el.querySelector("[data-countdown-status]");
  let timer = 0;

  const write = (node, value) => {
    const text = String(value).padStart(2, "0");
    if (node && node.textContent !== text) node.textContent = text;
  };

  const finish = (text) => {
    clearInterval(timer);
    timer = 0;
    status.textContent = text;
    el.setAttribute("aria-label", text);
    el.classList.add("is-done");
  };

  const tick = () => {
    const now = Date.now();
    if (now >= end) return finish(el.dataset.after);
    if (now >= start) return finish(el.dataset.during);
    let s = Math.floor((start - now) / 1000);
    const d = Math.floor(s / 86400);
    s -= d * 86400;
    const h = Math.floor(s / 3600);
    s -= h * 3600;
    const m = Math.floor(s / 60);
    write(units.d, d);
    write(units.h, h);
    write(units.m, m);
    write(units.s, s - m * 60);
  };

  const run = () => {
    tick();
    if (!timer && !el.classList.contains("is-done")) timer = setInterval(tick, 1000);
  };

  // No ticking in a hidden tab.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(timer);
      timer = 0;
    } else {
      run();
    }
  });

  run();
}
