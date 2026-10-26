// The QR page (13 October, docs/QR.md): looks up the delegate by the email they registered with
// (/api/pass.php, which asks the check-in app since 18 October), then draws their QR code, fills
// in their details and offers the pass as an image or a PDF to print. The code holds "OAKJMUN:"
// and a signed code for the desk scanner: never a web address or the delegate's details.
import qrcode from "qrcode-generator";

const form = document.querySelector("[data-qr-form]");
const status = document.querySelector("[data-qr-status]");
const code = document.querySelector("[data-qr-code]");
const placeholder = document.querySelector("[data-qr-placeholder]");
const saves = document.querySelector("[data-qr-saves]");
const save = document.querySelector("[data-qr-save]");
const pdfButton = document.querySelector("[data-qr-pdf]");
const read = (selector) => JSON.parse(document.querySelector(selector)?.textContent || "{}");
const messages = read("[data-qr-messages]");
const committees = read("[data-qr-committees]");
const pdfWords = read("[data-qr-pdf-words]");
const field = (key) => document.querySelector(`[data-qr-field="${key}"]`);
const choices = document.querySelector("[data-qr-choices]");
const card = document.querySelector("[data-qr-card]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const wait = (ms) => new Promise((done) => setTimeout(done, ms));

// The line under the form, in a tone: "busy" (three dots that pulse), "ok" (a tick) or
// "error" (a red dot and a small shake, played again if the same error comes twice).
const say = (text, tone = "") => {
  status.textContent = text;
  status.className = "qr__status";
  if (tone === "busy") {
    const dots = document.createElement("span");
    dots.className = "qr__dots";
    dots.setAttribute("aria-hidden", "true");
    dots.append(...[0, 1, 2].map(() => Object.assign(document.createElement("span"), { textContent: "." })));
    status.append(dots);
  }
  if (tone) {
    void status.offsetWidth;
    status.classList.add(`is-${tone}`);
  }
};

// Back to the empty card (a new search): the dashed square, quiet dashes, no saves.
const idleFrame = code?.innerHTML ?? "";
const reset = () => {
  current = null;
  card?.classList.remove("is-found");
  code.classList.remove("is-ready");
  code.innerHTML = idleFrame;
  code.setAttribute("aria-hidden", "true");
  code.removeAttribute("role");
  code.removeAttribute("aria-label");
  placeholder.hidden = false;
  saves.hidden = true;
  for (const key of ["name", "committee", "allocation", "detail", "link"]) {
    field(key).textContent = messages.empty;
    field(key).classList.add("is-empty");
  }
  field("detail").closest("[data-qr-optional]").hidden = true;
  document.querySelector(".qr__details-note")?.removeAttribute("hidden");
};

const busy = (on, button) => {
  card?.classList.toggle("is-loading", on);
  card?.setAttribute("aria-busy", String(on));
  button.classList.toggle("is-loading", on);
  button.disabled = on;
};

// The pass on screen, for the PDF.
let current = null;
const fileName = (name, ext) =>
  `oakjmun-pass-${String(name || "delegate").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.${ext}`;

// The committee, matched by its code or name as the allocation sheet writes it.
const committeeOf = (text) => {
  const key = text.trim().toLowerCase();
  return committees.find?.((c) => c.code.toLowerCase() === key || c.name.toLowerCase() === key);
};

// "Save as image" (21 October): the pass as a picture, like the card on the page. The name, then
// committee · allocation, then the code on a cream card with a white square around it. The
// colours are the site's own tokens, read from the CSS; the text is the page's Montserrat.
const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Lines of text that fit in `width`, at the largest size from `size` down that needs no more
// than `most` lines.
function fit(ctx, text, width, weight, size, most) {
  for (let px = size; ; px -= 2) {
    ctx.font = `${weight} ${px}px Montserrat, system-ui, sans-serif`;
    const lines = [];
    for (const word of text.split(" ")) {
      const last = lines.at(-1);
      if (last !== undefined && ctx.measureText(`${last} ${word}`).width <= width) lines[lines.length - 1] = `${last} ${word}`;
      else lines.push(word);
    }
    if (lines.length <= most || px <= size / 2) return { lines, px, font: ctx.font };
  }
}

async function passImage(pass, qr) {
  await Promise.all(["800 50px Montserrat", "500 28px Montserrat"].map((f) => document.fonts?.load(f).catch(() => {})));
  const W = 1080;
  const pad = 90;
  const card = 630; // the cream card
  const inset = 46; // cream border around the white square
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const name = fit(ctx, pass.name || "", W - pad * 2, 800, 50, 2);
  const line = [pass.code || pass.committee, pass.allocation].filter(Boolean).join(" · ");
  const sub = fit(ctx, line, W - pad * 2, 500, 28, 2);
  const nameH = name.lines.length * name.px * 1.2;
  const subH = sub.lines.length * sub.px * 1.35;
  canvas.width = W;
  canvas.height = Math.round(pad + nameH + 22 + subH + 62 + card + pad);

  ctx.fillStyle = token("--blue-700");
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  let y = pad;
  ctx.font = name.font;
  ctx.fillStyle = token("--ink");
  for (const l of name.lines) {
    ctx.fillText(l, W / 2, y);
    y += name.px * 1.2;
  }
  y += 22;
  ctx.font = sub.font;
  ctx.fillStyle = `rgba(${token("--ink-rgb").split(/\s+/).join(",")}, 0.6)`;
  for (const l of sub.lines) {
    ctx.fillText(l, W / 2, y);
    y += sub.px * 1.35;
  }
  // Whole pixels from here, so the squares of the code meet without seams.
  y = Math.round(y + 62);

  // The cream card, rounded, then the white square, then the code: dark on white with a quiet
  // border of two squares, so any scanner reads it.
  const x = (W - card) / 2;
  ctx.fillStyle = token("--ink");
  ctx.beginPath();
  ctx.roundRect(x, y, card, card, 42);
  ctx.fill();
  const square = card - inset * 2;
  ctx.fillStyle = token("--white");
  ctx.fillRect(x + inset, y + inset, square, square);
  const cells = qr.getModuleCount();
  const margin = 2;
  const cell = Math.floor(square / (cells + margin * 2));
  const offset = Math.round((square - cell * cells) / 2);
  ctx.fillStyle = token("--blue-950");
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(x + inset + offset + c * cell, y + inset + offset + r * cell, cell, cell);
    }
  }
  return canvas.toDataURL("image/png");
}

const show = (pass) => {
  const qr = qrcode(0, "M");
  qr.addData(pass.qr);
  qr.make();
  current = { pass, qr };
  code.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  code.classList.add("is-ready");
  code.removeAttribute("aria-hidden");
  code.setAttribute("role", "img");
  code.setAttribute("aria-label", `QR code for ${pass.name}`);
  placeholder.hidden = true;
  save.download = fileName(pass.name, "png");
  save.removeAttribute("href");
  passImage(pass, qr).then((url) => {
    if (current?.qr === qr) save.href = url;
  });
  saves.hidden = false;

  for (const key of ["name", "committee", "allocation"]) {
    field(key).textContent = pass[key] || messages.empty;
    field(key).classList.toggle("is-empty", !pass[key]);
  }
  // Portfolio, position, party and constituency, for the committees that have them.
  field("detail").textContent = pass.detail || "";
  field("detail").classList.remove("is-empty");
  field("detail").closest("[data-qr-optional]").hidden = !pass.detail;
  const committee = committeeOf(pass.code || "") ?? committeeOf(pass.committee || "");
  const link = document.createElement("a");
  link.href = committee?.url ?? "/committees/";
  link.textContent = committee ? `${committee.code} committee page` : "All committees";
  field("link").replaceChildren(link);
  field("link").classList.remove("is-empty");
  document.querySelector(".qr__details-note")?.setAttribute("hidden", "");
  // The code settles in, then the details one by one (CSS); on a phone, where the card is
  // below the form, it comes into view.
  card?.classList.remove("is-found");
  void card?.offsetWidth;
  card?.classList.add("is-found");
  const box = card?.getBoundingClientRect();
  if (box && (box.top > innerHeight * 0.6 || box.bottom < 0)) {
    card.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
  }
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  // Not open yet (site.json qrPage.open): the form is greyed out, and the server says no too.
  if (form.hasAttribute("data-closed")) return say(messages.closed, "error");
  const email = form.elements.email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say(messages.email, "error");
  const button = form.querySelector("button[type=submit]");
  choices.hidden = true;
  choices.replaceChildren();
  reset();
  busy(true, button);
  say(messages.searching, "busy");
  // A slow connection: say so, so nobody thinks it's stuck.
  const slow = setTimeout(() => say(messages.slow, "busy"), 5000);
  const started = performance.now();
  try {
    const res = await fetch("/api/pass.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    // At least half a second of skeleton, so a quick answer doesn't just flicker.
    await wait(Math.max(0, 500 - (performance.now() - started)));
    clearTimeout(slow);
    busy(false, button);
    if (res.ok && Array.isArray(body.people) && body.people.length) {
      // One email, more than one delegate: a button for each name, then that one's pass.
      say(messages.choose, "ok");
      for (const person of body.people) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn--outline qr__choice";
        button.textContent = person.name;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          for (const b of choices.children) b.setAttribute("aria-pressed", String(b === button));
          show(person);
          say(messages.found, "ok");
        });
        choices.append(button);
      }
      choices.hidden = false;
    } else if (res.ok && body.qr) {
      show(body);
      say(messages.found, "ok");
    } else {
      say(messages[body.error] ?? messages.error, "error");
    }
  } catch {
    say(messages.error, "error");
  } finally {
    clearTimeout(slow);
    busy(false, button);
  }
});

pdfButton?.addEventListener("click", async () => {
  if (!current) return;
  pdfButton.disabled = true;
  try {
    const { passPdf } = await import(new URL(form.dataset.pdf, document.baseURI).href);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(passPdf({ ...current, words: pdfWords }));
    link.download = fileName(current.pass.name, "pdf");
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  } catch {
    say(messages.error, "error");
  } finally {
    pdfButton.disabled = false;
  }
});
