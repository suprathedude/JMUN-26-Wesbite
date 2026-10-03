// Secretariat page (SPEC 9.4; layout from OakMUN XVI's later Secretariat page).
// - The portrait is a button that turns the card over (rotateY, .65 s). Once it's turned, a
//   click on the back turns it again; keyboard focus reaching the back (the Instagram link)
//   turns it over so the focused link is visible.
// - Rows fade in through reveal.js, like the rest of the site.
// - Each portrait drifts a little as the page scrolls: the photo or stripes slowly, the
//   initials a little more.
// - With a mouse, a small teal dot follows the pointer and opens into a "View" ring over a
//   portrait.
// Only transform and opacity change. With reduced motion only the turning over is left (and
// that without the animation).
const cards = [...document.querySelectorAll("[data-person]")];
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

for (const card of cards) {
  const button = card.querySelector(".person__flip");
  const back = card.querySelector(".person__back");
  const set = (flipped) => {
    card.classList.toggle("is-flipped", flipped);
    button.setAttribute("aria-pressed", String(flipped));
  };
  button.addEventListener("click", () => set(!card.classList.contains("is-flipped")));
  back.addEventListener("click", (event) => {
    if (!event.target.closest("a")) set(false);
  });
  back.addEventListener("focusin", () => set(true));
}

if (cards.length && !calm && "IntersectionObserver" in window) {
  // Portrait drift. Each portrait's position on screen, from -1 (just below) to 1 (just
  // above), moves the media up to 8% of the portrait's height and the initials up to 18%.
  const portraits = cards.map((card) => ({
    box: card.querySelector(".person__portrait"),
    far: card.querySelector("[data-parallax]"),
    near: card.querySelector("[data-parallax-near]"),
  }));
  const visible = new Set();
  let frame = 0;

  const drift = () => {
    frame = 0;
    const half = innerHeight / 2;
    const reads = [...visible].map((p) => [p, p.box.getBoundingClientRect()]);
    for (const [p, rect] of reads) {
      const t = Math.max(-1, Math.min(1, (half - (rect.top + rect.height / 2)) / (half + rect.height / 2)));
      p.far.style.transform = `translate3d(0, ${(t * rect.height * 0.08).toFixed(1)}px, 0)`;
      if (p.near) p.near.style.transform = `translate3d(0, ${(t * rect.height * 0.18).toFixed(1)}px, 0)`;
    }
  };
  const request = () => {
    if (!frame && visible.size) frame = requestAnimationFrame(drift);
  };

  const watch = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const p = portraits.find((item) => item.box === entry.target);
      if (entry.isIntersecting) visible.add(p);
      else visible.delete(p);
    }
    request();
  });
  portraits.forEach((p) => watch.observe(p.box));
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);

  // The pointer follower, for a mouse or trackpad only.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const cursor = document.createElement("div");
    cursor.className = "view-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="view-cursor__dot"></span><span class="view-cursor__ring">View</span>';
    document.body.append(cursor);

    const EASE = 0.22; // how quickly it catches the pointer, per 60 fps frame
    let x = 0;
    let y = 0;
    let toX = 0;
    let toY = 0;
    let moving = 0;
    let last = 0;

    const follow = (now) => {
      const dt = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      const k = 1 - Math.pow(1 - EASE, dt / 16.7);
      x += (toX - x) * k;
      y += (toY - y) * k;
      cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (Math.abs(toX - x) < 0.2 && Math.abs(toY - y) < 0.2) {
        moving = 0;
        return;
      }
      moving = requestAnimationFrame(follow);
    };

    addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      toX = event.clientX;
      toY = event.clientY;
      if (!cursor.classList.contains("is-shown")) {
        x = toX;
        y = toY;
        cursor.classList.add("is-shown");
      }
      const card = event.target.closest?.("[data-person]");
      const over = Boolean(event.target.closest?.(".person__portrait")) && !event.target.closest("a");
      cursor.classList.toggle("is-over", over);
      if (over) cursor.lastChild.textContent = card.classList.contains("is-flipped") ? "Back" : "View";
      if (!moving) {
        last = 0;
        moving = requestAnimationFrame(follow);
      }
    });
    document.documentElement.addEventListener("pointerleave", () => cursor.classList.remove("is-shown"));
    // A click turns the card, so the ring's word changes under a still pointer.
    addEventListener("click", (event) => {
      const card = event.target.closest?.("[data-person]");
      if (card && event.target.closest(".person__portrait")) {
        cursor.lastChild.textContent = card.classList.contains("is-flipped") ? "Back" : "View";
      }
    });
  }
}
