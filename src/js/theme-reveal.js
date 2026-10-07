// Conference theme reveal (SPEC 9.1, item 4; OakMUN's recording, 7 October). Loaded only when
// theme.enabled is true.
//
// Desktop with a mouse: a 240 vh sticky section. Scrolling brings up "Presenting the conference
// theme", which then dissolves, and the theme arrives word by word: each word comes in soft
// (a blurred copy) and settles sharp, rising slightly, then the gold line and the caption.
// It runs backwards on the way up. Phones and touch screens: the same word-by-word entrance,
// played once as the section comes into view (CSS, home.css). Reduced motion: shown as it is.
// The blur is a fixed filter on each word's ::before copy; only opacity and transform change.
const section = document.querySelector("[data-theme-reveal]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrubQuery = matchMedia("(pointer: fine) and (min-width: 981px)");

const clamp = (v) => Math.min(1, Math.max(0, v));
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

// A word at t from 0 (gone) to 1 (settled): its blurred copy (the element's ::before, through
// --soft) rises first and falls away as the sharp word comes in.
function focus(el, sharp, t) {
  const rise = clamp(t / 0.45);
  const fall = clamp((t - 0.45) / 0.55);
  el.style.setProperty("--soft", (t < 0.45 ? easeOut(rise) : 1 - easeInOut(fall)).toFixed(3));
  sharp.style.opacity = easeInOut(clamp((t - 0.25) / 0.75)).toFixed(3);
}

function scrub() {
  section.classList.add("is-scrubbing");
  const intro = section.querySelector("[data-theme-intro]");
  const pre = intro.querySelector(".theme__pre");
  const big = intro.querySelector(".theme__big");
  const bigSharp = big.querySelector(".theme__sharp");
  const words = [...section.querySelectorAll("[data-theme-word]")].map((el) => ({
    el,
    sharp: el.querySelector(".theme__sharp"),
  }));
  const others = [...section.querySelectorAll("[data-theme-part]:not([data-theme-word])")];

  // Where each part comes in, as a share of the section's scroll distance.
  const WORDS_FROM = 0.3;
  const WORDS_TO = 0.66;
  const step = (WORDS_TO - WORDS_FROM - 0.14) / Math.max(words.length - 1, 1);
  const windowFor = (el) => {
    if (el.classList.contains("theme__divider")) return [0.66, 0.74];
    if (el.classList.contains("theme__caption")) return [0.72, 0.86];
    return [0.26, 0.32]; // the eyebrow
  };

  let queued = false;
  const update = () => {
    queued = false;
    const rect = section.getBoundingClientRect();
    const p = clamp(-rect.top / (section.offsetHeight - innerHeight));

    // "Presenting the conference theme": in soft-to-sharp, then dissolves and lifts away.
    const inT = clamp((p - 0.01) / 0.12);
    const outT = clamp((p - 0.17) / 0.09);
    pre.style.opacity = (easeOut(clamp(inT / 0.7)) * (1 - easeOut(outT))).toFixed(3);
    if (outT > 0) {
      bigSharp.style.opacity = (1 - easeInOut(outT)).toFixed(3);
      big.style.setProperty("--soft", (Math.sin(Math.PI * outT) * 0.9).toFixed(3));
    } else {
      focus(big, bigSharp, inT);
    }
    intro.style.transform = `translateY(${(-28 * easeOut(outT)).toFixed(1)}px) scale(${(0.97 + 0.03 * easeOut(inT) + 0.03 * outT).toFixed(4)})`;

    // The theme, word by word.
    words.forEach((w, i) => {
      const a = WORDS_FROM + i * step;
      const t = clamp((p - a) / 0.14);
      focus(w.el, w.sharp, t);
      const e = easeOut(t);
      w.el.style.transform = t >= 1 ? "" : `translateY(${((1 - e) * 22).toFixed(1)}px) scale(${(0.96 + 0.04 * e).toFixed(4)})`;
    });

    // The eyebrow, the gold line and the caption.
    others.forEach((el) => {
      const [a, b] = windowFor(el);
      const t = easeOut(clamp((p - a) / (b - a)));
      el.style.opacity = t.toFixed(3);
      el.style.transform = el.classList.contains("theme__divider")
        ? `scaleX(${t.toFixed(3)})`
        : `translateY(${((1 - t) * 16).toFixed(1)}px)`;
    });
  };
  const onScroll = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };

  // Only listen while the section is near the screen.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      addEventListener("scroll", onScroll, { passive: true });
      update();
    } else {
      removeEventListener("scroll", onScroll);
    }
  }, { rootMargin: "100px 0px" }).observe(section);
}

function revealOnce() {
  section.classList.add("is-pending");
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      section.classList.replace("is-pending", "is-revealed");
    },
    { threshold: 0.35 },
  );
  observer.observe(section);
}

if (section && !calm && "IntersectionObserver" in window) {
  if (scrubQuery.matches) scrub();
  else revealOnce();
}
