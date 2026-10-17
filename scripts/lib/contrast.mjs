// Text contrast measured from the rendered page (SPEC 6: WCAG AA for all text). axe can't
// judge text over gradients and photos, which is most of this site, so this checks pixels.
// It scrolls down a screen at a time; at each stop it notes the visible text and its colour,
// makes all text transparent, captures the screen, and compares each text colour with the
// worst background pixel behind it (the lightest one for light text, the darkest for dark).
// Text that wraps is measured a line at a time (17 October): one box around all its lines
// also took in whatever sat beside the shorter lines, such as a highlighted word's background.
// It doesn't use a full-page capture: that enlarges the viewport, which moves anything sized
// in vh, so the measured boxes wouldn't line up with the pixels.
//
// With `within` (a selector, 17 October), only the text inside that box is checked, and the box
// is scrolled instead of the page: an open pop-up's card, which scrolls by itself over a locked,
// dimmed page.
import sharp from "sharp";

const AA = 4.5;
const AA_LARGE = 3; // 24 px and up, or 18.66 px and up in bold

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const blend = (fg, alpha, bg) => fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));

// Runs in the page: every element with its own visible text that sits fully on screen (or
// fully in sight inside `within`) and hasn't been checked at an earlier stop, and how it's drawn.
function collectText(within) {
  const parse = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 };
  };
  // The face of a flip card that's turned away (backface-visibility: hidden, rotated past 90
  // degrees by itself and its ancestors) isn't drawn, so its text isn't on screen.
  const facingAway = (el) => {
    for (let face = el; face; face = face.parentElement) {
      if (getComputedStyle(face).backfaceVisibility !== "hidden") continue;
      let m = new DOMMatrix();
      for (let a = face; a; a = a.parentElement) {
        const t = getComputedStyle(a).transform;
        if (t && t !== "none") m = new DOMMatrix(t).multiply(m);
      }
      if (m.m33 < 0) return true;
    }
    return false;
  };
  const root = within ? document.querySelector(within) : document.body;
  const view = within ? root.getBoundingClientRect() : { top: 0, bottom: innerHeight };
  const items = [];
  for (const el of root.querySelectorAll("*")) {
    if (el.dataset.contrastDone) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own.length) continue;
    if (el.closest('[aria-hidden="true"], .visually-hidden, [hidden], [aria-disabled="true"], .is-disabled, script, style, noscript')) continue;
    if (el.matches("input, textarea, select, option")) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    if (cs.backgroundClip === "text" || cs.webkitBackgroundClip === "text") continue; // gradient text: checked by eye
    if (facingAway(el)) continue;
    const boxes = own.flatMap((n) => {
      const range = document.createRange();
      range.selectNodeContents(n);
      return [...range.getClientRects()];
    }).filter((r) => r.width > 0 && r.height > 0);
    if (!boxes.length) continue;
    const left = Math.min(...boxes.map((r) => r.left));
    const top = Math.min(...boxes.map((r) => r.top));
    const right = Math.max(...boxes.map((r) => r.right));
    const bottom = Math.max(...boxes.map((r) => r.bottom));
    if (top < view.top || bottom > view.bottom) continue; // checked at another stop
    el.dataset.contrastDone = "1";
    let opacity = 1;
    for (let e = el; e; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
    if (opacity < 0.05) continue;
    const fill = cs.webkitTextFillColor && !/rgba?\(0, 0, 0, 0\)/.test(cs.webkitTextFillColor) ? cs.webkitTextFillColor : cs.color;
    const color = parse(fill);
    if (!color) continue;
    const path = [];
    for (let e = el; e && e !== document.body && path.length < 3; e = e.parentElement) {
      path.unshift(e.tagName.toLowerCase() + (e.classList.length ? "." + [...e.classList].slice(0, 2).join(".") : ""));
    }
    items.push({
      boxes: boxes.map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })),
      rgb: color.rgb,
      alpha: color.alpha * opacity,
      size: parseFloat(cs.fontSize),
      weight: parseInt(cs.fontWeight, 10),
      text: own.map((n) => n.textContent.trim()).join(" ").replace(/\s+/g, " ").slice(0, 40),
      where: path.join(" > "),
    });
  }
  return items;
}

// The fixed nav and strip would sit over other text at every stop after the first.
function hideFixed() {
  for (const el of document.querySelectorAll("body *")) {
    if (getComputedStyle(el).position === "fixed") el.style.visibility = "hidden";
  }
}

export async function contrastProblems(page, { within } = {}) {
  const problems = [];
  const { height, viewport } = await page.evaluate((sel) => {
    const box = sel && document.querySelector(sel);
    return box ? { height: box.scrollHeight, viewport: box.clientHeight } : { height: document.documentElement.scrollHeight, viewport: innerHeight };
  }, within);
  const step = Math.max(within ? 120 : 200, viewport - 240); // stops overlap, so every line is fully on screen at one of them
  for (let y = 0; y < height; y += step) {
    await page.evaluate(([top, sel]) => (sel ? (document.querySelector(sel).scrollTop = top) : scrollTo(0, top)), [y, within]);
    if (y > 0 && !within) await page.evaluate(hideFixed);
    await page.waitForTimeout(60);
    // Let transitions started by the scroll finish (the nav pill opening out again), so the
    // capture doesn't catch a button halfway in.
    await page.evaluate(() =>
      Promise.race([
        Promise.all(document.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.finished.catch(() => {}))),
        new Promise((done) => setTimeout(done, 2000)),
      ]),
    );
    const items = await page.evaluate(collectText, within);
    if (!items.length) continue;
    const style = await page.addStyleTag({
      content: "*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }",
    });
    const png = await page.screenshot();
    await style.evaluate((el) => el.remove());
    problems.push(...(await measure(png, items, page)));
  }
  await page.evaluate((sel) => (sel ? (document.querySelector(sel).scrollTop = 0) : scrollTo(0, 0)), within);
  return problems;
}

async function measure(png, items, page) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const scale = info.width / (await page.evaluate(() => innerWidth));
  const problems = [];
  for (const item of items) {
    const area = item.boxes.reduce((sum, b) => sum + b.w * b.h * scale * scale, 0);
    const step = Math.max(1, Math.floor(Math.sqrt(area / 600)));
    const pixels = [];
    for (const b of item.boxes) {
      // A pixel in from each edge: a highlighted word's background ends exactly where its
      // line's box does, so the outermost row can be the colour beyond it. Letters never reach
      // the edge of their box.
      const inset = Math.min(1, b.w / 4, b.h / 4);
      const x0 = Math.max(0, Math.ceil((b.x + inset) * scale));
      const y0 = Math.max(0, Math.ceil((b.y + inset) * scale));
      const x1 = Math.min(info.width, Math.floor((b.x + b.w - inset) * scale));
      const y1 = Math.min(info.height, Math.floor((b.y + b.h - inset) * scale));
      for (let y = y0; y < y1; y += step) {
        for (let x = x0; x < x1; x += step) {
          const i = (y * info.width + x) * 3;
          pixels.push([data[i], data[i + 1], data[i + 2]]);
        }
      }
    }
    if (!pixels.length) continue;
    pixels.sort((a, b) => luminance(a) - luminance(b));
    const median = pixels[Math.floor(pixels.length / 2)];
    const lightText = luminance(blend(item.rgb, item.alpha, median)) > luminance(median);
    // The worst background pixel, ignoring the most extreme 5% (anti-aliasing, specks).
    const worst = lightText ? pixels[Math.floor(pixels.length * 0.95)] : pixels[Math.floor(pixels.length * 0.05)];
    const text = blend(item.rgb, item.alpha, worst);
    const r = ratio(text, worst);
    const large = item.size >= 24 || (item.size >= 18.66 && item.weight >= 700);
    const need = large ? AA_LARGE : AA;
    if (r < need) {
      problems.push(`${r.toFixed(2)}:1, needs ${need}:1, "${item.text}" (${item.where}, ${Math.round(item.size)} px)`);
    }
  }
  return problems;
}
