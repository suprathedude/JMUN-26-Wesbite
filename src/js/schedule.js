// Schedule timeline (SPEC 9.1, item 7; layout from OakMUN XVI's later schedule). Each day's
// line fills teal as the page scrolls, down to a point 65% of the way down the screen, and an
// event's dot lights once the fill reaches it. (Day titles and rows fade in through reveal.js.)
// Only transform and opacity change. With reduced motion the lines are drawn in full.
const section = document.querySelector("[data-schedule]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (section && !calm && "IntersectionObserver" in window) {
  const ANCHOR = 0.65; // how far down the screen the fill reaches
  const days = [...section.querySelectorAll("[data-line]")].map((body) => ({
    body,
    fill: body.querySelector(".sched-line__fill"),
    items: [...body.querySelectorAll(".sched-item")],
    height: 0,
    dotY: [], // each dot's centre, from the top of the day's line
  }));
  let frame = 0;
  let onScreen = false;

  const measure = () => {
    for (const day of days) {
      day.height = day.body.offsetHeight;
      day.dotY = day.items.map((item) => {
        const dot = item.querySelector(".sched-item__dot");
        return item.offsetTop + dot.offsetTop + dot.offsetHeight / 2;
      });
    }
  };

  const update = () => {
    frame = 0;
    const anchor = innerHeight * ANCHOR;
    // Read every position first, then write, so the browser lays out once.
    const reach = days.map((day) => anchor - day.body.getBoundingClientRect().top);
    days.forEach((day, d) => {
      const progress = Math.min(1, Math.max(0, reach[d] / day.height));
      day.fill.style.transform = `scaleY(${progress.toFixed(4)})`;
      day.items.forEach((item, i) => item.classList.toggle("is-lit", reach[d] >= day.dotY[i]));
    });
  };

  const request = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  measure();
  update();
  section.classList.add("is-live");

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) request();
  }).observe(section);

  addEventListener(
    "scroll",
    () => {
      if (onScreen) request();
    },
    { passive: true },
  );

  // Re-measure when the layout changes: a resize, or the web font arriving.
  new ResizeObserver(() => {
    measure();
    request();
  }).observe(section);
}
