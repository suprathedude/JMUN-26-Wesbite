// Hero video (SPEC 5). The hero image is its poster: it paints first and stays the LCP
// element. The video only loads after the page has, only on screens 768 px and wider, never
// with Save-Data or reduced motion, and only plays while it's on screen and the tab is open.
const video = document.querySelector("[data-hero-video]");
const skip =
  !video ||
  innerWidth < 768 ||
  navigator.connection?.saveData ||
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function start() {
  const sources = [
    [video.dataset.webm, 'video/webm; codecs="av01.0.05M.08"'],
    [video.dataset.mp4, "video/mp4"],
  ];
  for (const [src, type] of sources) {
    const source = document.createElement("source");
    source.src = src;
    source.type = type;
    video.append(source);
  }
  video.addEventListener("playing", () => video.classList.add("is-playing"), { once: true });

  let onScreen = false;
  const update = () => {
    if (onScreen && !document.hidden) video.play().catch(() => {});
    else video.pause();
  };
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    update();
  }).observe(video);
  document.addEventListener("visibilitychange", update);
}

if (!skip) {
  if (document.readyState === "complete") start();
  else addEventListener("load", start, { once: true });
}
