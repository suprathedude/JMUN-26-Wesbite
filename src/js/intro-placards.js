// Homepage opening (PLAN.md F14): the page opens close in on a crowd holding up country
// placards (site.json hero.art). Scrolling pulls back to show the whole room, the crowd sinks a
// little, and the title rises into the space above it, then the dates, buttons and countdown.
// Scrolling back up reverses it. The hero stays on screen (sticky) while the page scrolls the
// length of its track.
//
// Only transform and opacity change, once per frame and only while the hero is on screen.
// html.hero-scroll is set in <head> unless motion is reduced; without it the hero shows the
// picture as it is and this does nothing.
const root = document.documentElement;
const track = document.querySelector("[data-hero-track]");
const art = document.querySelector("[data-hero-art] img");

if (track && art && root.classList.contains("hero-scroll")) {
  const hero = track.querySelector(".hero");
  const title = hero.querySelector(".hero__title");
  const later = [...hero.querySelectorAll(".hero__meta, .hero__actions, .countdown")];
  const cue = hero.querySelector(".hero__cue");
  const ZOOM = 1.6; // how close in the page opens
  const PULLED = 0.6; // share of the scroll by which the view has pulled all the way back

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const out = (v) => 1 - Math.pow(1 - v, 3); // ease out
  let range = 1;
  let frame = 0;
  let onScreen = true;

  const measure = () => {
    range = Math.max(1, track.offsetHeight - hero.offsetHeight);
  };

  const update = () => {
    frame = 0;
    const p = clamp(-track.getBoundingClientRect().top / range);
    // Pull back from the placards, then let the crowd sink a little as the page moves on.
    const back = out(clamp(p / PULLED));
    const sink = clamp((p - PULLED) / (1 - PULLED));
    art.style.transform = `translate3d(0, ${(sink * 6).toFixed(2)}%, 0) scale(${(ZOOM - (ZOOM - 1) * back).toFixed(4)})`;
    // The title rises into the space above the crowd, then the rest follows.
    const up = out(clamp((p - 0.22) / 0.36));
    title.style.opacity = up.toFixed(3);
    title.style.transform = `translate3d(0, ${((1 - up) * 36).toFixed(1)}px, 0)`;
    const rest = out(clamp((p - 0.42) / 0.3));
    for (const el of later) {
      el.style.opacity = rest.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - rest) * 18).toFixed(1)}px, 0)`;
    }
    cue.style.opacity = (1 - clamp(p / 0.1)).toFixed(3);
  };

  const request = () => {
    if (!frame && onScreen) frame = requestAnimationFrame(update);
  };

  measure();
  update();
  root.classList.add("hero-live");

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    request();
  }).observe(track);
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", () => {
    measure();
    request();
  });

  // Keyboard: tabbing to the hero's buttons scrolls to where they're fully shown.
  hero.addEventListener("focusin", () => {
    const top = track.getBoundingClientRect().top + scrollY;
    if (scrollY - top < range * 0.8) scrollTo(0, top + range * 0.8);
  });
}
