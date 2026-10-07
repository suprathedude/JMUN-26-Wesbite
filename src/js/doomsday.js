// Doomsday's opening (PLAN.md F28, partials/doomsday.njk). The Marvel Studios intro plays
// full-screen as the page opens; when it ends (or on a scroll, tap, key or Skip) DOOMSDAY comes
// up. Scrolling down, Doom's clip plays once most of the scene is on screen, and his line types
// out as he turns to face you; scrolling back above it resets it. A taller cut of his clip is
// used on portrait screens. With reduced motion nothing plays: the stills and the line show as
// they are. Arriving back from another page (or at a #section) skips the intro.
const opening = document.querySelector("[data-dd-opening]");
const lair = document.querySelector("[data-dd-lair]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (opening && lair && !calm) {
  const intro = opening.querySelector("[data-dd-intro]");
  const doom = lair.querySelector("[data-dd-doom]");
  const line = lair.querySelector("[data-dd-line]");
  const canvas = lair.querySelector("[data-dd-motes]");
  const startedLate = !opening.classList.contains("is-intro"); // the head-of-section script gave up
  opening.classList.add("is-ready");
  lair.classList.add("is-motion");

  // ---------- The intro ----------
  let fallback = 0;
  const SKIPS = ["wheel", "touchstart", "keydown", "pointerdown"];
  const done = () => {
    clearTimeout(fallback);
    intro.pause();
    opening.classList.remove("is-intro");
    opening.classList.add("is-titled", "is-done");
    SKIPS.forEach((type) => removeEventListener(type, done));
    doom.preload = "auto"; // Doom's clip is next
  };
  const showTitle = () => {
    opening.classList.remove("is-intro");
    opening.classList.add("is-titled");
    clearTimeout(fallback);
    fallback = setTimeout(done, 2900);
  };
  const back = performance.getEntriesByType?.("navigation")[0]?.type === "back_forward";
  const canPlay = intro.canPlayType("video/mp4") || intro.canPlayType("video/webm");
  if (startedLate || back || location.hash || !canPlay) {
    done();
  } else {
    SKIPS.forEach((type) => addEventListener(type, done, { passive: true }));
    opening.querySelector("[data-dd-skip]").addEventListener("click", done);
    intro.addEventListener("ended", showTitle);
    fallback = setTimeout(showTitle, 9000); // in case "ended" never comes
    // Both clips are preload="none" in the page, so nothing downloads unless it plays.
    intro.preload = "auto";
    const playing = intro.play();
    playing?.catch?.(() => done()); // the browser won't play it: straight to the title
  }

  // ---------- The lair ----------
  // A taller cut on portrait screens, so Doom stays in the middle of the frame.
  if (innerWidth / innerHeight < 0.9) {
    for (const source of doom.querySelectorAll("source")) source.src = source.src.replace("/doom.", "/doom-tall.");
    doom.poster = doom.poster.replace("/doom-poster.", "/doom-tall-poster.");
    doom.load();
  }

  // The line, letter by letter, in word groups.
  const words = line.textContent.trim().split(/\s+/);
  const label = line.textContent.trim();
  line.textContent = "";
  line.setAttribute("aria-label", label);
  const chars = [];
  words.forEach((word, w) => {
    const group = document.createElement("span");
    group.className = "dd-line__word";
    group.setAttribute("aria-hidden", "true");
    for (const c of word + (w < words.length - 1 ? " " : "")) {
      const span = document.createElement("span");
      span.textContent = c;
      group.append(span);
      chars.push(span);
    }
    line.append(group);
  });
  const caret = document.createElement("span");
  caret.className = "dd-line__caret";
  caret.setAttribute("aria-hidden", "true");
  line.append(caret);

  let typed = 0;
  let typing = 0;
  const typeOn = () => {
    if (typing || typed) return;
    line.classList.add("is-typing");
    typing = setInterval(() => {
      if (typed >= chars.length) {
        clearInterval(typing);
        typing = 0;
        setTimeout(() => line.classList.remove("is-typing"), 1600);
        return;
      }
      chars[typed++].classList.add("is-on");
    }, 85);
  };
  const typeOff = () => {
    clearInterval(typing);
    typing = 0;
    typed = 0;
    chars.forEach((c) => c.classList.remove("is-on"));
    line.classList.remove("is-typing");
  };

  // He speaks as he turns to face you, near the end of the clip.
  const SPEAK_AT = 7.4;
  doom.addEventListener("timeupdate", () => {
    if (doom.currentTime >= SPEAK_AT) typeOn();
  });
  doom.addEventListener("ended", typeOn);

  let playing = false;
  const reset = () => {
    playing = false;
    lair.classList.remove("is-playing");
    doom.pause();
    try {
      doom.currentTime = 0;
    } catch {
      // Not loaded yet: nothing to rewind.
    }
    typeOff();
  };

  // Green motes drifting up over the scene, only while it's on screen.
  const ctx = canvas.getContext("2d");
  let motes = [];
  let onScreen = false;
  let moteFrame = 0;
  let last = 0;
  const sizeMotes = () => {
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = innerWidth < 700 ? 26 : 54;
    motes = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      r: 0.6 + Math.random() * 2,
      v: 8 + Math.random() * 24,
      sway: Math.random() * Math.PI * 2,
      a: 0.15 + Math.random() * 0.5,
    }));
  };
  const drawMotes = (now) => {
    moteFrame = 0;
    if (!onScreen) {
      last = 0;
      return;
    }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getComputedStyle(line).color;
    for (const m of motes) {
      m.y -= m.v * dt;
      m.sway += dt * 0.8;
      if (m.y < -10) {
        m.y = h + 10;
        m.x = Math.random() * w;
      }
      ctx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(m.sway * 3));
      ctx.beginPath();
      ctx.arc(m.x + Math.sin(m.sway) * 12, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    moteFrame = requestAnimationFrame(drawMotes);
  };

  let frame = 0;
  const check = () => {
    frame = 0;
    const rect = lair.getBoundingClientRect();
    // Play once most of the scene is on screen; start over if you scroll back above it.
    if (!playing && rect.top < innerHeight * 0.35 && rect.bottom > innerHeight * 0.5) {
      playing = true;
      lair.classList.add("is-playing");
      try {
        doom.currentTime = 0;
      } catch {
        // Not loaded yet: it starts from the beginning anyway.
      }
      doom.play()?.catch?.(() => typeOn()); // can't play: his last frame and the line
    } else if (playing && rect.top > innerHeight * 0.9) {
      reset();
    }
    onScreen = rect.bottom > 0 && rect.top < innerHeight;
    if (onScreen && !moteFrame) moteFrame = requestAnimationFrame(drawMotes);
  };

  sizeMotes();
  check();
  addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(check);
  }, { passive: true });
  addEventListener("resize", () => {
    sizeMotes();
    check();
  });
}
