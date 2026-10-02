// Social Night sky (SPEC 9.8): bats drifting along curved paths and amber embers rising.
// They're added here rather than in the HTML, so with reduced motion there are none at all.
// Desktop: 4 bats and 18 embers. Phones: 2 bats and no embers. The CSS animates transform
// and opacity only, and everything pauses while the hero is off-screen or the tab is hidden.
const sky = document.querySelector("[data-sky]");
const calm = matchMedia("(prefers-reduced-motion: reduce)");
const phone = matchMedia("(max-width: 768px)");

const BAT =
  '<svg viewBox="0 0 100 44" focusable="false"><path d="M50 15L46.5 7L44.5 16Q26 6 2 12Q10 14 12 24Q18 18 24 26Q30 21 36 31Q41 26 45 34Q48 38 50 42Q52 38 55 34Q59 26 64 31Q70 21 76 26Q82 18 88 24Q90 14 98 12Q74 6 55.5 16L53.5 7Z"/></svg>';

// Small seeded random generator, so the sky looks the same on every visit.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build() {
  sky.replaceChildren();
  if (calm.matches) return;
  const random = seeded(31);
  const small = phone.matches;

  const bats = small ? 2 : 4;
  for (let i = 0; i < bats; i++) {
    const bat = document.createElement("span");
    bat.className = "bat" + (i % 2 ? " bat--back" : "");
    bat.style.setProperty("--top", `${small ? 22 + random() * 18 : 16 + random() * 40}%`);
    bat.style.setProperty("--size", `${small ? 34 : 38 + random() * 22}px`);
    bat.style.setProperty("--dur", `${24 + random() * 16}s`);
    bat.style.setProperty("--delay", `${(-random() * 30).toFixed(1)}s`);
    bat.style.setProperty("--bob", `${2.4 + random() * 1.8}s`);
    bat.style.setProperty("--flap", `${0.2 + random() * 0.08}s`);
    bat.innerHTML = `<span class="bat__bob"><span class="bat__wings">${BAT}</span></span>`;
    sky.append(bat);
  }

  if (small) return;
  const height = sky.clientHeight || 700;
  for (let i = 0; i < 18; i++) {
    const ember = document.createElement("span");
    ember.className = "ember";
    ember.style.setProperty("--x", `${4 + random() * 92}%`);
    ember.style.setProperty("--s", `${2 + random() * 2.5}px`);
    ember.style.setProperty("--dur", `${9 + random() * 7}s`);
    ember.style.setProperty("--delay", `${(-random() * 16).toFixed(1)}s`);
    ember.style.setProperty("--dx", `${Math.round((random() - 0.5) * 90)}px`);
    ember.style.setProperty("--rise", `${Math.round(height * (0.45 + random() * 0.4))}px`);
    sky.append(ember);
  }
}

if (sky) {
  build();
  phone.addEventListener("change", build);
  calm.addEventListener("change", build);

  let onScreen = true;
  const update = () => sky.classList.toggle("is-paused", !onScreen || document.hidden);
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    update();
  }).observe(sky);
  document.addEventListener("visibilitychange", update);
}
