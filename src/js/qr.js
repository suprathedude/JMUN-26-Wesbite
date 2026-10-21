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

const say = (text) => {
  status.textContent = text;
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

// A PNG of the code for "Save QR code": black on white with a quiet border, 12 px a square.
const png = (qr) => {
  const cells = qr.getModuleCount();
  const size = 12;
  const margin = 4;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = (cells + margin * 2) * size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + margin) * size, (r + margin) * size, size, size);
    }
  }
  return canvas.toDataURL("image/png");
};

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
  save.href = png(qr);
  save.download = fileName(pass.name, "png");
  saves.hidden = false;

  field("name").textContent = pass.name || "TBC";
  field("committee").textContent = pass.committee || "TBC";
  field("allocation").textContent = pass.allocation || "TBC";
  // Portfolio, position, party and constituency, for the committees that have them.
  field("detail").textContent = pass.detail || "";
  field("detail").closest("[data-qr-optional]").hidden = !pass.detail;
  const committee = committeeOf(pass.code || "") ?? committeeOf(pass.committee || "");
  const link = document.createElement("a");
  link.href = committee?.url ?? "/committees/";
  link.textContent = committee ? `${committee.code} committee page` : "All committees";
  field("link").replaceChildren(link);
  document.querySelector(".qr__details-note")?.setAttribute("hidden", "");
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  // Not open yet (site.json qrPage.open): the form is greyed out, and the server says no too.
  if (form.hasAttribute("data-closed")) return say(messages.closed);
  const email = form.elements.email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say(messages.email);
  const button = form.querySelector("button");
  button.disabled = true;
  say(messages.searching);
  try {
    const res = await fetch("/api/pass.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.qr) {
      show(body);
      say(messages.found);
    } else {
      say(messages[body.error] ?? messages.error);
    }
  } catch {
    say(messages.error);
  } finally {
    button.disabled = false;
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
    say(messages.error);
  } finally {
    pdfButton.disabled = false;
  }
});
