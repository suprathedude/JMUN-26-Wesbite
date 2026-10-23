// "Read more" on executive board and IP team cards (SPEC 8.6). Bios are cut to two lines; the
// button, shown only when a bio is actually cut off, opens the whole card in a pop-out (23
// October): it grows out of the card into the middle of the screen with the page dimmed behind,
// and shrinks back into it when closed (the button, Esc or a click outside). Only transform and
// opacity move; with reduced motion it simply appears.
const dialog = document.querySelector("[data-bio-pop]");
const root = document.documentElement;
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

let from = null; // the card the pop-out came from
let closing = false;

// The pop-out's card, moved and scaled to sit where `card` is (for growing out of and back into it).
const over = (panel, card) => {
  const a = card.getBoundingClientRect();
  const b = panel.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${Math.max(0.3, a.width / b.width)})`;
};

function fill(card) {
  const photo = dialog.querySelector("[data-bio-photo]");
  const img = card.querySelector(".eb-card__photo img");
  if (img) {
    const copy = new Image();
    copy.src = img.currentSrc || img.src;
    copy.alt = img.alt;
    copy.style.objectPosition = img.style.objectPosition;
    photo.replaceChildren(copy);
  } else {
    photo.replaceChildren(...[card.querySelector(".photo-tbc")?.cloneNode(true)].filter(Boolean));
  }
  dialog.querySelector("[data-bio-role]").textContent = card.querySelector(".eb-card__role")?.textContent ?? "";
  dialog.querySelector("[data-bio-name]").textContent = card.querySelector(".eb-card__name")?.textContent ?? "";
  dialog.querySelector("[data-bio-text]").textContent = card.querySelector(".eb-card__bio")?.textContent ?? "";
}

function open(card) {
  from = card;
  closing = false;
  fill(card);
  dialog.showModal();
  dialog.querySelector(".bio-pop__card").scrollTop = 0;
  dialog.querySelector(".bio-pop__body").scrollTop = 0;
  root.classList.add("notice-open");
  dispatchEvent(new Event("nav:lock"));
  if (still()) return;
  const panel = dialog.querySelector(".bio-pop__card");
  panel.animate([{ transform: over(panel, card), opacity: 0 }, { opacity: 1, offset: 0.35 }, { transform: "none", opacity: 1 }], { duration: 480, easing: EASE });
  try {
    dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, pseudoElement: "::backdrop" });
  } catch {}
}

async function close() {
  if (!dialog.open || closing) return;
  closing = true;
  if (!still() && from) {
    const panel = dialog.querySelector(".bio-pop__card");
    const card = from.getBoundingClientRect();
    // Back into the card if it's still on screen; otherwise just fade.
    const visible = card.bottom > 0 && card.top < innerHeight;
    const shrink = panel.animate(
      [{ transform: "none", opacity: 1 }, { transform: visible ? over(panel, from) : "translateY(12px) scale(0.98)", opacity: 0 }],
      { duration: 300, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
    );
    try {
      dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, pseudoElement: "::backdrop", fill: "forwards" });
    } catch {}
    await shrink.finished.catch(() => {});
    dialog.close();
    for (const a of dialog.getAnimations({ subtree: true })) a.cancel();
  } else {
    dialog.close();
  }
}

if (dialog) {
  dialog.addEventListener("close", () => {
    closing = false;
    root.classList.remove("notice-open");
    dispatchEvent(new Event("nav:unlock"));
    from?.querySelector(".eb-card__more")?.focus({ preventScroll: true });
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault(); // Esc: close with the animation
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.querySelector("[data-bio-close]").addEventListener("click", close);
}

for (const card of document.querySelectorAll("[data-readmore]")) {
  const bio = card.querySelector(".eb-card__bio");
  const button = card.querySelector(".eb-card__more");
  if (!bio || !button || !dialog) continue;
  if (bio.scrollHeight > bio.clientHeight + 2) button.hidden = false;
  button.addEventListener("click", () => open(card));
}
