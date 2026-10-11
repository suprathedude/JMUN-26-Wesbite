// Secretariat flip cards (SPEC 9.4). A click anywhere on a card turns it over (rotateY, .65 s);
// the Flip button, kept for keyboards and screen readers but not shown (11 October), does the
// same. Keyboard focus reaching the back (the Instagram link) turns the card over so the focused
// link is visible. With a mouse, a small "Flip me" label follows the pointer over a card.
const cards = document.querySelectorAll("[data-person]");

for (const card of cards) {
  const button = card.querySelector(".person__flip");
  const back = card.querySelector(".person__back");
  const set = (flipped) => {
    card.classList.toggle("is-flipped", flipped);
    button.setAttribute("aria-pressed", String(flipped));
  };
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    set(!card.classList.contains("is-flipped"));
  });
  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    set(!card.classList.contains("is-flipped"));
  });
  back.addEventListener("focusin", () => set(true));
}

if (cards.length && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const hint = document.createElement("div");
  hint.className = "flip-hint";
  hint.setAttribute("aria-hidden", "true");
  document.body.append(hint);
  let over = null;

  const show = (event) => {
    const card = event.target.closest?.("[data-person]");
    // Not over the Instagram button: that's a link, not a flip.
    if (!card || event.target.closest("a")) {
      hint.classList.remove("is-on");
      over = null;
      return;
    }
    over = card;
    hint.textContent = card.classList.contains("is-flipped") ? "Flip back" : "Flip me";
    hint.style.transform = `translate3d(${event.clientX + 16}px, ${event.clientY + 18}px, 0)`;
    hint.classList.add("is-on");
  };
  addEventListener("pointermove", show, { passive: true });
  addEventListener("click", (event) => {
    if (over && event.target.closest("[data-person]") === over) show(event);
  });
  addEventListener("scroll", () => hint.classList.remove("is-on"), { passive: true });
}
