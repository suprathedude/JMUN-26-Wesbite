// Secretariat flip cards (SPEC 9.4). The Flip button turns the card over (rotateY, .65 s);
// with a mouse, clicking anywhere on the card does the same. Keyboard focus reaching the
// back (the Instagram link) turns the card over so the focused link is visible.
for (const card of document.querySelectorAll("[data-person]")) {
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
