// FAQ accordion: one answer open at a time. The answer's text fades in (PLAN.md D6), and the
// questions and everything below them glide to their new places instead of jumping (FLIP:
// measure, change, then animate the difference with transform). Without JS every answer is
// visible; with reduced motion the change is instant.
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// Every element after `el` in the page, at each level up to <body>: what moves when it grows.
const followers = (el) => {
  const out = [];
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    for (let next = node.nextElementSibling; next; next = next.nextElementSibling) {
      if (getComputedStyle(next).position !== "fixed") out.push(next);
    }
  }
  return out;
};

const glide = (els, change) => {
  if (calm || !("animate" in Element.prototype)) return change();
  const before = els.map((el) => el.getBoundingClientRect().top);
  change();
  els.forEach((el, i) => {
    const dy = before[i] - el.getBoundingClientRect().top;
    if (Math.abs(dy) < 0.5) return;
    el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 480, easing: EASE });
  });
};

for (const list of document.querySelectorAll("[data-faq]")) {
  const items = [...list.querySelectorAll(".faq-item")];

  const setOpen = (item, open) => {
    item.classList.toggle("is-open", open);
    item.querySelector(".faq-q").setAttribute("aria-expanded", String(open));
  };

  for (const item of items) {
    item.querySelector(".faq-q").addEventListener("click", () => {
      const open = !item.classList.contains("is-open");
      glide([...items, ...followers(list)], () => {
        for (const other of items) if (other !== item) setOpen(other, false);
        setOpen(item, open);
      });
    });
  }
}
