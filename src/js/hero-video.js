// Hero video (SPEC 5). The hero image is its poster: it paints first and stays the LCP
// element. The video only loads after the page has, never with Save-Data, a 2G connection or
// reduced motion, and only plays while it's on screen and the tab is open. Phones play it too
// (8 October): upright screens get a portrait cut from the middle, about a third of the size.
// On a first visit it waits for the photo intro to hand over (8 October): before, it played
// under the photos, so the first seconds were gone by the time the hero showed.
const video = document.querySelector("[data-hero-video]");
const skip =
  !video ||
  navigator.connection?.saveData ||
  /(^|-)2g$/.test(navigator.connection?.effectiveType ?? "") ||
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function start() {
  const tall = innerHeight > innerWidth && video.dataset.webmTall;
  const sources = [
    [tall ? video.dataset.webmTall : video.dataset.webm, 'video/webm; codecs="av01.0.05M.08"'],
    [tall ? video.dataset.mp4Tall : video.dataset.mp4, "video/mp4"],
  ];
  for (const [src, type] of sources) {
    const source = document.createElement("source");
    source.src = src;
    source.type = type;
    video.append(source);
  }
  video.addEventListener("playing", () => video.classList.add("is-playing"), { once: true });

  let onScreen = false;
  const introShowing = () => document.documentElement.classList.contains("gallery-active");
  const update = () => {
    if (onScreen && !document.hidden && !introShowing()) video.play().catch(() => {});
    else video.pause();
  };
  addEventListener("gallery:state", update);
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
