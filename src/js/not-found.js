// 404 (8 October): the clock in the bottom strip counts up from when the page opened, like a
// TV left on a dead channel.
const clock = document.querySelector("[data-nf-clock]");
if (clock) {
  const start = Date.now();
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const s = Math.floor((Date.now() - start) / 1000);
    clock.textContent = `${pad(Math.floor(s / 60) % 100)}:${pad(s % 60)}`;
  };
  setInterval(tick, 1000);
}
