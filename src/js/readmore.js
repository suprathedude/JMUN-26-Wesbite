// "Read more" for executive board bios clamped to two lines (SPEC 8.6). The button only
// appears when the bio is actually cut off.
for (const card of document.querySelectorAll("[data-readmore]")) {
  const bio = card.querySelector(".eb-card__bio");
  const button = card.querySelector(".eb-card__more");
  if (!bio || !button) continue;
  if (bio.scrollHeight > bio.clientHeight + 2) button.hidden = false;
  button.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "Show less" : "Read more";
  });
}
