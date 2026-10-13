// The QR page (13 October, docs/QR.md): looks up the delegate by the email they registered with
// (/api/pass.php), then draws their QR code and fills in their details. The code holds a link to
// the desk check-in page with a signed code, never the delegate's details.
import qrcode from "qrcode-generator";

const form = document.querySelector("[data-qr-form]");
const status = document.querySelector("[data-qr-status]");
const code = document.querySelector("[data-qr-code]");
const placeholder = document.querySelector("[data-qr-placeholder]");
const save = document.querySelector("[data-qr-save]");
const read = (selector) => JSON.parse(document.querySelector(selector)?.textContent || "{}");
const messages = read("[data-qr-messages]");
const committees = read("[data-qr-committees]");
const field = (key) => document.querySelector(`[data-qr-field="${key}"]`);

const say = (text) => {
  status.textContent = text;
};

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
  qr.addData(`${form.dataset.site}/qr/check/#${pass.token}`);
  qr.make();
  code.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  code.classList.add("is-ready");
  code.removeAttribute("aria-hidden");
  code.setAttribute("role", "img");
  code.setAttribute("aria-label", `QR code for ${pass.name}`);
  placeholder.hidden = true;
  save.href = png(qr);
  save.hidden = false;

  field("name").textContent = pass.name || "TBC";
  field("committee").textContent = pass.committee || "TBC";
  field("allocation").textContent = pass.allocation || "TBC";
  const committee = committeeOf(pass.committee || "");
  const link = document.createElement("a");
  link.href = committee?.url ?? "/committees/";
  link.textContent = committee ? `${committee.code} committee page` : "All committees";
  field("link").replaceChildren(link);
  document.querySelector(".qr__details-note")?.setAttribute("hidden", "");
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
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
    if (res.ok && body.token) {
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
