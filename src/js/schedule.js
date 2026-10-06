// Schedule (SPEC 9.1, item 7; layout from OakMUN XVI's later schedule).
//
// Day tabs (6 October): one day at a time. The highlight glides to the chosen tab, the old
// day slides out and the new one in, its rows following a moment apart. Arrow keys, Home and
// End move between the tabs; #day-2 in the address opens that day.
//
// Share timetable: draws both days into one image (1080 x 1350) from the rows on the page,
// so it always matches them. Phones open the share sheet; computers download the file.
//
// Each day's line fills teal as the page scrolls, down to a point 65% of the way down the
// screen, and an event's dot lights once the fill reaches it. (Rows fade in through
// reveal.js.) Only transform and opacity change. With reduced motion the tabs switch at once
// and the lines are drawn in full.
const section = document.querySelector("[data-schedule]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";

if (section) {
  initTabs();
  initShare();
  if (!calm && "IntersectionObserver" in window) initLines();
}

function initTabs() {
  const list = section.querySelector("[data-sched-tabs]");
  if (!list) return;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  const motion = !calm && "animate" in Element.prototype;
  let current = 0;
  let leaving = null; // the running slide-out, if any

  const showCurrent = () => {
    panels.forEach((panel, i) => panel.classList.toggle("is-active", i === current));
    // The rows are on screen already: skip their own scroll-in entrance.
    for (const el of panels[current].querySelectorAll("[data-reveal]")) el.classList.add("is-in", "is-done");
  };

  const select = (index, { focus = false, animate = true } = {}) => {
    if (focus) tabs[index].focus();
    if (index === current) return;
    const dir = index > current ? 1 : -1;
    const from = panels.find((panel) => panel.classList.contains("is-active"));
    current = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    list.style.setProperty("--active", String(index));

    leaving?.cancel();
    if (!motion || !animate || !from) {
      showCurrent();
      return;
    }
    leaving = from.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-dir * 24}px)` }], {
      duration: 160,
      easing: EASE_IN,
    });
    leaving.finished.then(
      () => {
        leaving = null;
        showCurrent();
        const to = panels[current];
        to.animate([{ opacity: 0, transform: `translateX(${dir * 32}px)` }, { opacity: 1, transform: "none" }], {
          duration: 450,
          easing: EASE_OUT_EXPO,
        });
        to.querySelectorAll(".sched-item").forEach((item, i) => {
          item.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], {
            duration: 420,
            delay: Math.min(i, 10) * 28,
            easing: EASE_OUT_EXPO,
            fill: "backwards",
          });
        });
      },
      () => {}, // cancelled by a newer choice, which takes over
    );
  };

  tabs.forEach((tab, i) => tab.addEventListener("click", () => select(i)));
  list.addEventListener("keydown", (event) => {
    const i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    const n = tabs.length;
    const next = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, { focus: true });
  });

  const fromHash = () => {
    const index = panels.findIndex((panel) => `#${panel.id}` === location.hash);
    if (index !== -1) select(index, { animate: false });
  };
  fromHash();
  addEventListener("hashchange", fromHash);
}

function initShare() {
  const button = section.querySelector("[data-sched-share]");
  if (!button || !("toBlob" in HTMLCanvasElement.prototype)) return;
  button.hidden = false;

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const blob = await drawTimetable(button.dataset.heading);
      const file = new File([blob], button.dataset.file, { type: "image/png" });
      const phone = matchMedia("(pointer: coarse)").matches;
      if (phone && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: section.dataset.shareTitle });
          return;
        } catch (error) {
          if (error.name === "AbortError") return; // closed the share sheet
        }
      }
      const url = URL.createObjectURL(blob);
      const link = Object.assign(document.createElement("a"), { href: url, download: file.name });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      button.disabled = false;
    }
  });
}

// Both days side by side on one 1080 x 1350 image (Instagram's portrait size), in the
// site's colours, read from the CSS tokens.
async function drawTimetable(heading) {
  const W = 1080;
  const H = 1350;
  const M = 64; // outer margin
  const GAP = 48; // between the columns
  const css = getComputedStyle(document.documentElement);
  const token = (name) => css.getPropertyValue(name).trim();
  const ink = token("--ink-rgb");
  const teal = token("--teal");
  const tealRgb = token("--teal-rgb");
  const FONT = "Montserrat, system-ui, sans-serif";
  await Promise.all(["800 54px", "700 22px", "600 17px"].map((f) => document.fonts.load(`${f} Montserrat`)));

  const days = [...section.querySelectorAll(".sched-day")].map((day) => ({
    label: day.dataset.dayLabel,
    date: day.dataset.dayDate,
    rows: [...day.querySelectorAll(".sched-item")].map((item) => ({
      time: item.querySelector(".sched-item__time").textContent.trim(),
      title: item.querySelector(".sched-item__title").textContent.trim(),
      social: item.classList.contains("sched-item--social"),
    })),
  }));

  const canvas = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const ctx = canvas.getContext("2d");
  const text = (value, x, y, font, color, spacing = "0px") => {
    ctx.font = `${font} ${FONT}`;
    ctx.fillStyle = color;
    ctx.letterSpacing = spacing;
    ctx.fillText(value, x, y);
  };
  // Shrinks a line's font until it fits the width.
  const fit = (value, weight, size, width) => {
    let s = size;
    ctx.letterSpacing = "0px";
    for (; s > 12; s--) {
      ctx.font = `${weight} ${s}px ${FONT}`;
      if (ctx.measureText(value).width <= width) break;
    }
    return `${weight} ${s}px`;
  };

  // Background: the navy ramp with a soft teal glow at the top.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, token("--blue-800"));
  bg.addColorStop(1, token("--blue-950"));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.75);
  glow.addColorStop(0, `rgb(${tealRgb} / 0.16)`);
  glow.addColorStop(1, `rgb(${tealRgb} / 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Header: crest, name, title, dates and place.
  const crest = document.querySelector(".nav__crest .crest-img");
  let nameX = M;
  if (crest?.complete && crest.naturalWidth) {
    const h = 64;
    const w = (h * crest.naturalWidth) / crest.naturalHeight;
    ctx.drawImage(crest, M, 52, w, h);
    nameX = M + w + 20;
  }
  text(section.dataset.shareTitle.toUpperCase(), nameX, 94, "800 22px", teal, "3px");
  text(heading, M, 200, fit(heading, 800, 56, W - 2 * M), `rgb(${ink})`);
  const dates = section.dataset.shareDates;
  text(dates, M, 242, fit(dates, 600, 20, W - 2 * M), `rgb(${ink} / 0.7)`);

  // The two columns.
  const colW = (W - 2 * M - GAP) / days.length;
  const top = 300;
  const footer = 96;
  const headBlock = 74;
  const maxRows = Math.max(...days.map((d) => d.rows.length));
  const rowH = Math.min(78, (H - top - headBlock - footer) / maxRows);
  days.forEach((day, d) => {
    const x = M + d * (colW + GAP);
    text(day.label.toUpperCase(), x, top + 28, "800 26px", `rgb(${ink})`, "1px");
    text(day.date, x, top + 54, "600 17px", teal);
    ctx.fillStyle = `rgb(${tealRgb} / 0.6)`;
    ctx.fillRect(x, top + headBlock - 8, colW, 2);
    day.rows.forEach((row, r) => {
      const y = top + headBlock + r * rowH;
      if (row.social) {
        ctx.fillStyle = `rgb(${tealRgb} / 0.14)`;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x - 12, y + 2, colW + 24, rowH - 4, 10);
          ctx.fill();
        } else {
          ctx.fillRect(x - 12, y + 2, colW + 24, rowH - 4);
        }
      }
      text(row.time, x, y + rowH * 0.42, fit(row.time, 600, 17, colW), `rgb(${ink} / 0.65)`);
      const title = row.title.toUpperCase();
      text(title, x, y + rowH * 0.8, fit(title, 800, 22, colW), row.social ? teal : `rgb(${ink})`, "0px");
    });
  });

  // Footer: the address.
  ctx.fillStyle = `rgb(${ink} / 0.1)`;
  ctx.fillRect(M, H - footer + 8, W - 2 * M, 1);
  text(section.dataset.shareUrl, M, H - 40, "700 20px", teal, "1px");

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/png"));
}

function initLines() {
  const ANCHOR = 0.65; // how far down the screen the fill reaches
  const days = [...section.querySelectorAll("[data-line]")].map((body) => ({
    body,
    fill: body.querySelector(".sched-line__fill"),
    items: [...body.querySelectorAll(".sched-item")],
    height: 0,
    dotY: [], // each dot's centre, from the top of the day's line
  }));
  let frame = 0;
  let onScreen = false;

  const measure = () => {
    for (const day of days) {
      day.height = day.body.offsetHeight;
      day.dotY = day.items.map((item) => {
        const dot = item.querySelector(".sched-item__dot");
        return item.offsetTop + dot.offsetTop + dot.offsetHeight / 2;
      });
    }
  };

  const update = () => {
    frame = 0;
    const anchor = innerHeight * ANCHOR;
    // Read every position first, then write, so the browser lays out once. A hidden day
    // has no height and is skipped.
    const reach = days.map((day) => anchor - day.body.getBoundingClientRect().top);
    days.forEach((day, d) => {
      if (!day.height) return;
      const progress = Math.min(1, Math.max(0, reach[d] / day.height));
      day.fill.style.transform = `scaleY(${progress.toFixed(4)})`;
      day.items.forEach((item, i) => item.classList.toggle("is-lit", reach[d] >= day.dotY[i]));
    });
  };

  const request = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  measure();
  update();
  section.classList.add("is-live");

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) request();
  }).observe(section);

  addEventListener(
    "scroll",
    () => {
      if (onScreen) request();
    },
    { passive: true },
  );

  // Re-measure when the layout changes: a resize, the web font arriving, or another day
  // being picked.
  new ResizeObserver(() => {
    measure();
    request();
  }).observe(section);
}
