// Desk check-in for volunteers (13 October, docs/QR.md).
//
// Scanning: "Scan QR codes" asks for the back camera (any camera on a laptop, for testing) and
// reads codes about eight times a second, with the browser's own reader where there is one
// (Android) and jsQR where there isn't (iPhones; loaded only then). Each code goes to
// /api/checkin.php with the volunteer PIN; the result shows below the camera, the picture
// flashes green, amber or red and the phone buzzes. A code that stays in view is read once.
// The screen stays on while scanning, and the camera stops when the page is hidden.
//
// A code opened from the phone's own camera app arrives after the # and is checked in the same
// way. The PIN stays on this phone (localStorage) until "Forget PIN".
const KEY = "oakjmun-check-pin";
const read = (selector) => JSON.parse(document.querySelector(selector)?.textContent || "{}");
const $ = (selector) => document.querySelector(selector);
const messages = read("[data-check-messages]");
const words = read("[data-check-words]");
const pinForm = $("[data-check-pin]");
const emailForm = $("[data-check-email]");
const result = $("[data-check-result]");
const state = $("[data-check-state]");
const details = $("[data-check-details]");
const countLine = $("[data-check-count]");
const view = $("[data-check-view]");
const video = $("[data-check-video]");
const flash = $("[data-check-flash]");
const startButton = $("[data-check-start]");
const stopButton = $("[data-check-stop]");
const cameraNote = $("[data-check-camera-note]");
const recentList = $("[data-check-recent]");
const waiting = state.textContent;
const recent = [];

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

const post = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, pin }),
  });

const BUZZ = { ok: [70], warn: [60, 60, 60], bad: [220] };
const show = (tone, text, person) => {
  result.dataset.tone = tone;
  state.textContent = text;
  details.hidden = !person;
  if (person) {
    for (const key of ["name", "committee", "allocation"]) {
      details.querySelector(`[data-check-field="${key}"]`).textContent = person[key] || "TBC";
    }
  }
  if (tone && !view.hidden) {
    flash.dataset.tone = tone;
    flash.classList.remove("is-on");
    void flash.offsetWidth; // restart the flash
    flash.classList.add("is-on");
    navigator.vibrate?.(BUZZ[tone]);
  }
};

const counted = (body) => {
  if (!Number.isInteger(body.total)) return;
  countLine.textContent = `${body.arrived} of ${body.total} ${words.count}`;
  countLine.hidden = false;
};

// The last few people checked in on this phone, newest first.
const remember = (body) => {
  recent.unshift(body);
  recent.length = Math.min(recent.length, 8);
  recentList.replaceChildren(
    ...recent.map((p) => {
      const li = document.createElement("li");
      li.className = "check__item";
      li.dataset.tone = p.already ? "warn" : "ok";
      const time = document.createElement("span");
      time.className = "check__time";
      time.textContent = p.at;
      const who = document.createElement("span");
      who.textContent = [p.name, p.committee, p.allocation].filter(Boolean).join(", ");
      li.append(time, who);
      return li;
    }),
  );
};

// Sends one check-in (by QR code or email); with neither, only tests the PIN.
let busy = false;
const checkIn = async (what) => {
  if (!pin) {
    pinForm.hidden = false;
    pinForm.elements.pin.focus();
    return;
  }
  busy = true;
  if (what) show("", messages.working);
  try {
    const res = await post("/api/checkin.php", what ?? { check: "pin" });
    const body = await res.json().catch(() => ({}));
    counted(body);
    if (body.error === "pin") {
      keepPin("");
      stopCamera();
    }
    if (!res.ok) return show("bad", messages[body.error] ?? messages.error);
    if (!what) return show("", waiting);
    show(body.already ? "warn" : "ok", body.already ? `${messages.already} ${body.at}` : messages.ok, body);
    remember(body);
  } catch {
    show("bad", messages.error);
  } finally {
    busy = false;
  }
};

// The code inside a QR: our link to this page with the code after the #, or the bare code.
const tokenFrom = (text) => text.match(/\/qr\/check\/#([0-9a-f]{20})$/)?.[1] ?? (/^[0-9a-f]{20}$/.test(text) ? text : null);

/* ---------- Camera ---------- */

let stream = null;
let reader = null;
let wakeLock = null;
let timer = 0;
let lastText = "";
let lastSeen = 0;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const makeReader = async () => {
  if ("BarcodeDetector" in window) {
    try {
      if ((await BarcodeDetector.getSupportedFormats()).includes("qr_code")) {
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        return async () => (await detector.detect(video))[0]?.rawValue;
      }
    } catch {}
  }
  const { default: jsQR } = await import("jsqr");
  return async () => {
    // The middle square of the picture, at most 640 px, is plenty for a code held up close.
    const w = video.videoWidth;
    const h = video.videoHeight;
    const side = Math.min(w, h);
    const size = Math.min(side, 640);
    canvas.width = canvas.height = size;
    ctx.drawImage(video, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
    return jsQR(ctx.getImageData(0, 0, size, size).data, size, size, { inversionAttempts: "dontInvert" })?.data;
  };
};

const scan = async () => {
  timer = 0;
  if (!stream) return;
  if (!busy && video.readyState >= 2 && video.videoWidth) {
    const text = await reader().catch(() => null);
    const now = Date.now();
    if (text) {
      // The same code still in view (or back within 4 s) is read once.
      const repeat = text === lastText && now - lastSeen < 4000;
      lastText = text;
      lastSeen = now;
      if (!repeat) {
        const token = tokenFrom(text);
        if (token) checkIn({ token });
        else show("bad", messages.notOurs);
      }
    }
  }
  if (stream) timer = setTimeout(scan, 120);
};

const cameraError = (error) => {
  const name = error?.name ?? "";
  cameraNote.textContent =
    name === "NotAllowedError" || name === "SecurityError"
      ? messages.cameraBlocked
      : name === "NotFoundError" || name === "OverconstrainedError"
        ? messages.cameraMissing
        : messages.cameraUnsupported;
};

const startCamera = async () => {
  if (!pin) {
    pinForm.hidden = false;
    pinForm.elements.pin.focus();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) return cameraError();
  cameraNote.textContent = messages.cameraStarting;
  startButton.disabled = true;
  try {
    try {
      // The back camera only, on phones.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { exact: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (error) {
      // Laptops have no back camera: use the one there is, so the page can be tried out.
      if (error.name !== "OverconstrainedError" && error.name !== "NotFoundError") throw error;
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
    video.srcObject = stream;
    await video.play().catch(() => {});
    reader ??= await makeReader();
    view.hidden = false;
    startButton.hidden = true;
    stopButton.hidden = false;
    cameraNote.textContent = "";
    wakeLock = await navigator.wakeLock?.request("screen").catch(() => null);
    lastText = "";
    scan();
  } catch (error) {
    stopCamera();
    cameraError(error);
  } finally {
    startButton.disabled = false;
  }
};

function stopCamera() {
  clearTimeout(timer);
  timer = 0;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
  wakeLock?.release().catch(() => {});
  wakeLock = null;
  view.hidden = true;
  startButton.hidden = false;
  stopButton.hidden = true;
}

startButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && stream) stopCamera();
});

/* ---------- PIN, email, codes from the camera app, tools ---------- */

// The code from the QR after the #, once, so reloading the page doesn't send it again.
const fromHash = () => {
  const token = location.hash.slice(1);
  if (!/^[0-9a-f]{20}$/.test(token)) return null;
  history.replaceState(null, "", location.pathname);
  return { token };
};

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

$("[data-check-forget]").addEventListener("click", () => {
  stopCamera();
  keepPin("");
  show("", waiting);
  countLine.hidden = true;
});

$("[data-check-download]").addEventListener("click", async () => {
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
