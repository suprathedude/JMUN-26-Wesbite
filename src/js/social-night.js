// Social Night (SPEC 9.8): the glyph portal at the top of the page, and the night sky's bats
// and embers.
//
// The portal (7 October, PLAN.md F22): unless motion is reduced, the head script sets
// html.portal-on and this file loads the React island (src/islands/social-portal.tsx, bundled
// to /js/social-portal.js) once the page's font is ready, since the word is measured in it.
// The island takes the hero's sky, title block and opening lines into the portal. If it fails,
// the hero shows as it is.
//
// Bats (7 October): each one flies its own erratic path, the way bats hunt: quick, fluttery
// wingbeats (downstroke faster than upstroke, wings half folded on the way up), sudden darts
// and turns, banking into them, now and then a short glide. They're drawn in 3D, as seen from
// below at an angle, so a turning bat foreshortens and its wings sweep towards and away from
// you. Desktop: 5 bats and 18 embers. Phones: 3 bats and no embers. They're added here rather
// than in the HTML, so with reduced motion there are none. Only transforms change, and
// nothing moves while the sky is off-screen or the tab is hidden.
const root = document.documentElement;
const sky = document.querySelector("[data-sky]");
const calm = matchMedia("(prefers-reduced-motion: reduce)");
const phone = matchMedia("(max-width: 768px)");

// ---------- Glyph portal ----------

const intro = document.querySelector("[data-portal]");
if (intro && root.classList.contains("portal-on")) {
  root.classList.add("portal-ready");
  const switchOff = () => {
    root.classList.remove("portal-on");
    intro.classList.remove("has-portal");
  };
  // The word is measured in the page's font, so wait for it (but not for long).
  const font = Promise.race([
    document.fonts.load('900 100px "Montserrat"', intro.dataset.word || "A"),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]).catch(() => {});
  Promise.all([import(new URL(intro.dataset.bundle, document.baseURI).href), font])
    .then(([{ mount }]) => {
      mount(intro.querySelector("[data-portal-root]"), {
        word: (intro.dataset.word || "").split("|").join("\n"),
        enterLabel: intro.dataset.enter || "",
        scene: intro.querySelector("[data-portal-scene]"),
        content: intro.querySelector("[data-portal-content]"),
        front: intro.querySelector("[data-portal-front]"),
      });
      intro.classList.add("has-portal");
    })
    .catch(switchOff);
}

// ---------- Bats and embers ----------

// One wing from below (shoulder on the right, at 52 6), with the scalloped trailing edge
// between the finger tips, and the body with its ears.
const WING_LEFT = "M52 6Q41 -1 30 1Q16 2 1 7Q13 11 9 21Q19 18 24 28Q37 22 47 32L52 30Z";
const WING_RIGHT = "M0 6Q11 -1 22 1Q36 2 51 7Q39 11 43 21Q33 18 28 28Q15 22 5 32L0 30Z";
const BODY = "M3 0L5.5 7Q8 6 10.5 7L13 0L13.5 9Q15 12 14 17Q13 26 8 34Q3 26 2 17Q1 12 2.5 9Z";
const svg = (box, d) => `<svg viewBox="${box}" focusable="false"><path d="${d}"/></svg>`;

const TAU = Math.PI * 2;
const wrap = (a) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

// Small seeded random generator, so the sky starts the same on every visit.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let bats = [];
let random = seeded(31);
let width = 1;
let height = 1;

function makeBat(size, depth) {
  const el = document.createElement("span");
  el.className = "bat";
  el.style.setProperty("--size", `${size}px`);
  el.style.setProperty("--haze", `${Math.round(depth * 45)}%`); // further away, paler
  el.innerHTML =
    `<span class="bat__wing bat__wing--left">${svg("0 0 52 34", WING_LEFT)}</span>` +
    `<span class="bat__wing bat__wing--right">${svg("0 0 52 34", WING_RIGHT)}</span>` +
    `<span class="bat__body">${svg("0 0 16 34", BODY)}</span>`;
  sky.append(el);
  return {
    el,
    left: el.children[0],
    right: el.children[1],
    size,
    x: width * (0.1 + random() * 0.8),
    y: height * (0.1 + random() * 0.5),
    heading: random() * TAU,
    want: random() * TAU,
    speed: size * (2.6 + random()),
    cruise: size * (2.6 + random()),
    burst: 1,
    roll: 0,
    tilt: 34 + random() * 16, // degrees: how far its head is tipped away from us
    phase: random() * TAU,
    beat: 7 + random() * 2.5, // wingbeats a second
    nextDart: random() * 1.5,
    glide: 0,
    wobble: random() * TAU,
  };
}

function flyBat(bat, dt) {
  // Darts: a sudden new direction and a burst of speed, every half second to two seconds.
  bat.nextDart -= dt;
  if (bat.nextDart <= 0) {
    bat.want = bat.heading + (random() < 0.5 ? -1 : 1) * (0.5 + random() * 1.9);
    bat.burst = 1.25 + random() * 0.45;
    bat.nextDart = 0.45 + random() * 1.7;
    if (random() < 0.18) bat.glide = 0.25 + random() * 0.35;
  }
  // Out of its patch of sky: head back towards the middle.
  const margin = bat.size * 1.5;
  if (bat.x < -margin || bat.x > width + margin || bat.y < -margin || bat.y > height * 0.82) {
    bat.want = Math.atan2(height * (0.25 + random() * 0.3) - bat.y, width * (0.2 + random() * 0.6) - bat.x);
    bat.nextDart = Math.max(bat.nextDart, 0.6);
  }
  // Turn towards where it wants to go, fast, with a flutter of small corrections on top.
  const before = bat.heading;
  const turn = wrap(bat.want - bat.heading);
  bat.heading += Math.max(-7 * dt, Math.min(7 * dt, turn * 6 * dt)) + (random() - 0.5) * 2.2 * dt;
  const turnRate = wrap(bat.heading - before) / Math.max(dt, 0.001);
  bat.roll += (Math.max(-1, Math.min(1, turnRate * 0.18)) - bat.roll) * Math.min(1, dt * 10);

  bat.burst += (1 - bat.burst) * Math.min(1, dt * 1.6);
  bat.speed += (bat.cruise * bat.burst * (bat.glide > 0 ? 1.15 : 1) - bat.speed) * Math.min(1, dt * 4);
  bat.x += Math.cos(bat.heading) * bat.speed * dt;
  bat.y += Math.sin(bat.heading) * bat.speed * dt;

  // Wingbeat: the downstroke is quicker than the upstroke, and the wings half fold on the way
  // up. In a glide they hold still, slightly raised.
  let stroke;
  let fold;
  if (bat.glide > 0) {
    bat.glide -= dt;
    stroke = 12;
    fold = 1;
  } else {
    bat.phase += TAU * bat.beat * dt * (0.9 + 0.25 * (bat.burst - 1));
    const p = bat.phase + 0.45 * Math.sin(bat.phase);
    stroke = 52 * Math.cos(p); // degrees: up is positive
    fold = 1 - 0.24 * Math.max(0, -Math.sin(p));
  }
  // The body lifts a little on each downstroke, and drifts sideways a touch.
  bat.wobble += dt * 3.1;
  const lift = -Math.sin(bat.phase) * bat.size * 0.04;
  const drift = Math.sin(bat.wobble) * bat.size * 0.05;
  const px = bat.x - Math.sin(bat.heading) * drift;
  const py = bat.y + Math.cos(bat.heading) * drift + lift;

  // Seen from below, as bats overhead are: rolled into its turns about its own length, its
  // head tipped away from us, then pointed where it's going (the shapes point up).
  const facing = (bat.heading * 180) / Math.PI + 90;
  bat.el.style.transform =
    `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) perspective(${bat.size * 9}px) ` +
    `rotateZ(${facing.toFixed(1)}deg) rotateX(${bat.tilt.toFixed(1)}deg) rotateY(${(bat.roll * 50).toFixed(1)}deg)`;
  bat.left.style.transform = `rotateY(${(-stroke).toFixed(1)}deg) scaleX(${fold.toFixed(3)})`;
  bat.right.style.transform = `rotateY(${stroke.toFixed(1)}deg) scaleX(${fold.toFixed(3)})`;
}

function build() {
  sky.replaceChildren();
  bats = [];
  if (calm.matches) return;
  random = seeded(31);
  const small = phone.matches;
  width = sky.clientWidth || innerWidth;
  height = sky.clientHeight || innerHeight;

  // Near bats are bigger and faster; far ones small, slow and faint.
  const sizes = small ? [44, 32, 22] : [66, 54, 42, 32, 24];
  sizes.forEach((size, i) => bats.push(makeBat(size, i / Math.max(1, sizes.length - 1))));

  if (small) return;
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
  let frame = 0;
  let last = 0;
  const tick = (now) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    for (const bat of bats) flyBat(bat, dt);
    frame = requestAnimationFrame(tick);
  };
  const update = () => {
    const running = onScreen && !document.hidden && bats.length > 0;
    sky.classList.toggle("is-paused", !running);
    if (running && !frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    } else if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
  // The whole intro, not the sky: inside the portal the sky is clipped to the letters, and
  // the observer doesn't notice when that clip moves.
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    update();
  }).observe(sky.closest("[data-portal]") ?? sky);
  document.addEventListener("visibilitychange", update);
  // The sky changes size when it moves into the portal, and with the window.
  new ResizeObserver(() => {
    width = sky.clientWidth || width;
    height = sky.clientHeight || height;
  }).observe(sky);
  phone.addEventListener("change", update);
  calm.addEventListener("change", update);
}
