// Conference theme reveal (SPEC 9.1, item 4). Loaded only when theme.enabled is true.
// Desktop with a mouse: a 200 vh sticky section where scrolling brings in "Presenting the
// conference theme", then the eyebrow, each word, the divider and the caption. Opacity and
// a small translate only, no blur; it reverses on the way back up. Everywhere else: one
// simple reveal when the section comes into view. Reduced motion: shown as it is.
const section = document.querySelector("[data-theme-reveal]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrubQuery = matchMedia("(pointer: fine) and (min-width: 981px)");

const clamp = (v) => Math.min(1, Math.max(0, v));
const easeOut = (t) => 1 - (1 - t) ** 3;

function scrub() {
  section.classList.add("is-scrubbing");
  const intro = section.querySelector("[data-theme-intro]");
  const parts = [...section.querySelectorAll("[data-reveal]")];
  const words = parts.filter((el) => el.classList.contains("theme__word"));
  const wordSpan = 0.28 / Math.max(words.length, 1);

  // [start, end] of each part's entrance, as a share of the section's scroll distance.
  const windows = parts.map((el) => {
    if (el.classList.contains("theme__word")) {
      const i = words.indexOf(el);
      return [0.34 + i * wordSpan, 0.34 + i * wordSpan + 0.1];
    }
    if (el.classList.contains("theme__divider")) return [0.66, 0.74];
    if (el.classList.contains("theme__caption")) return [0.72, 0.86];
    return [0.26, 0.34]; // eyebrow
  });

  let queued = false;
  const update = () => {
    queued = false;
    const rect = section.getBoundingClientRect();
    const p = clamp(-rect.top / (section.offsetHeight - innerHeight));
    const out = easeOut(clamp((p - 0.16) / 0.12));
    intro.style.opacity = String(1 - out);
    intro.style.transform = `translateY(${(-24 * out).toFixed(1)}px)`;
    parts.forEach((el, i) => {
      const [a, b] = windows[i];
      const t = easeOut(clamp((p - a) / (b - a)));
      el.style.opacity = t.toFixed(3);
      el.style.transform = el.classList.contains("theme__divider")
        ? `scaleX(${t.toFixed(3)})`
        : `translateY(${((1 - t) * 40).toFixed(1)}px)`;
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
    { threshold: 0.25 },
  );
  observer.observe(section);
}

if (section && !calm && "IntersectionObserver" in window) {
  if (scrubQuery.matches) scrub();
  else revealOnce();
}
