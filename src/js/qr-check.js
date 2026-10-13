// Desk check-in for volunteers (13 October, docs/QR.md). Opened from a delegate's QR code with
// their code after the #, it checks them in through /api/checkin.php with the volunteer PIN,
// which stays on this phone (localStorage) until "Forget PIN".
const KEY = "oakjmun-check-pin";
const read = (selector) => JSON.parse(document.querySelector(selector)?.textContent || "{}");
const messages = read("[data-check-messages]");
const words = read("[data-check-words]");
const pinForm = document.querySelector("[data-check-pin]");
const emailForm = document.querySelector("[data-check-email]");
const result = document.querySelector("[data-check-result]");
const state = document.querySelector("[data-check-state]");
const details = document.querySelector("[data-check-details]");
const countLine = document.querySelector("[data-check-count]");

let pin = "";
try {
  pin = localStorage.getItem(KEY) || "";
} catch {}
const keepPin = (value) => {
  pin = value;
  try {
    value ? localStorage.setItem(KEY, value) : localStorage.removeItem(KEY);
  } catch {}
  pinForm.hidden = Boolean(value);
};

const post = async (url, body) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, pin }),
  });
  return res;
};

const show = (tone, text, person) => {
  result.dataset.tone = tone;
  state.textContent = text;
  details.hidden = !person;
  if (person) {
    for (const key of ["name", "committee", "allocation"]) {
      details.querySelector(`[data-check-field="${key}"]`).textContent = person[key] || "TBC";
    }
  }
};

const counted = (body) => {
  if (Number.isInteger(body.total)) countLine.textContent = `${body.arrived} of ${body.total} ${words.count}`;
};

// Sends one check-in (by QR code or email); with neither, only tests the PIN.
const checkIn = async (what) => {
  if (!pin) {
    pinForm.hidden = false;
    return;
  }
  show("", messages.working);
  try {
    const res = await post("/api/checkin.php", what ?? { check: "pin" });
    const body = await res.json().catch(() => ({}));
    counted(body);
    if (body.error === "pin") keepPin("");
    if (!res.ok) return show("bad", messages[body.error] ?? messages.error);
    if (!what) return show("", state.dataset.waiting);
    show(body.already ? "warn" : "ok", body.already ? `${messages.already} ${body.at}` : messages.ok, body);
  } catch {
    show("bad", messages.error);
  }
};

// The code from the QR, once, so reloading the page doesn't send it again.
const fromHash = () => {
  const token = location.hash.slice(1);
  if (!/^[0-9a-f]{20}$/.test(token)) return null;
  history.replaceState(null, "", location.pathname);
  return { token };
};

state.dataset.waiting = state.textContent;
pinForm.hidden = Boolean(pin);
let pending = fromHash();

pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = pinForm.elements.pin.value.trim();
  if (!value) return;
  keepPin(value);
  pinForm.reset();
  checkIn(pending ?? undefined);
  pending = null;
});

emailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = emailForm.elements.email.value.trim();
  if (!email) return;
  emailForm.reset();
  checkIn({ email });
});

addEventListener("hashchange", () => {
  const next = fromHash();
  if (next) checkIn(next);
});

document.querySelector("[data-check-forget]").addEventListener("click", () => {
  keepPin("");
  show("", state.dataset.waiting);
  countLine.textContent = "";
});

document.querySelector("[data-check-download]").addEventListener("click", async () => {
  if (!pin) {
    pinForm.hidden = false;
    return;
  }
  try {
    const res = await post("/api/arrivals.php", {});
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.error === "pin") keepPin("");
      return show("bad", messages[body.error] ?? messages.error);
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(await res.blob());
    link.download = "oakjmun-arrivals.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch {
    show("bad", messages.error);
  }
});

if (pin) {
  checkIn(pending ?? undefined);
  pending = null;
}
