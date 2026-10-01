// FAQ accordion: one answer open at a time. Opening is instant; CSS fades the text in
// (PLAN.md D6). Without JS every answer is visible.
for (const list of document.querySelectorAll("[data-faq]")) {
  const items = [...list.querySelectorAll(".faq-item")];

  const setOpen = (item, open) => {
    item.classList.toggle("is-open", open);
    item.querySelector(".faq-q").setAttribute("aria-expanded", String(open));
  };

  for (const item of items) {
    item.querySelector(".faq-q").addEventListener("click", () => {
      const open = !item.classList.contains("is-open");
      for (const other of items) if (other !== item) setOpen(other, false);
      setOpen(item, open);
    });
  }
}
