// Hero video (SPEC 5). The hero image is its poster: it paints first and stays the LCP
// element. The video only loads after the page has, never with Save-Data, a 2G connection or
// reduced motion, and only plays while it's on screen and the tab is open. Phones play it too
// (8 October): upright screens get a portrait cut from the middle, about a third of the size.
// On a first visit it waits for the photo intro to hand over (8 October): before, it played
// under the photos, so the first seconds were gone by the time the hero showed. Since 11 October
// it downloads while the photos are showing and starts as the hero begins to appear, so there's
// no wait at the handover.
const video = document.querySelector("[data-hero-video]");
const skip =
  !video ||
  navigator.connection?.saveData ||
  /(^|-)2g$/.test(navigator.connection?.effectiveType ?? "") ||
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const root = document.documentElement;
let started = false;

function start() {
  if (started) return;
  started = true;
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
  video.preload = "auto";
  video.load();

  let onScreen = false;
  const introShowing = () => root.classList.contains("gallery-active") && !root.classList.contains("gallery-handover");
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
  // With the photo intro, the page's load event waits for all its photos; the video starts
  // downloading after 2.5 s at the latest, well before anyone has scrolled through the intro.
  if (root.classList.contains("gallery-on")) setTimeout(start, 2500);
}
