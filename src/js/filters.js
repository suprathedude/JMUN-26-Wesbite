// The committee search (SPEC 9.2): typing filters the tiles instantly, and the number of
// results is announced to screen readers.
//
// Markup: a [data-filters] block holding a [data-search] input, a [data-count] live region, a
// [data-empty] message, and [data-item] elements with data-search text. Options on
// [data-filters]:
//   data-noun="committees"      used in "Showing 3 of 11 committees"
//   data-pill="View committee"  a pill that follows the pointer over the items
for (const root of document.querySelectorAll("[data-filters]")) {
  const search = root.querySelector("[data-search]");
  const items = [...root.querySelectorAll("[data-item]")];
  const count = root.querySelector("[data-count]");
  const empty = root.querySelector("[data-empty]");
  const noun = root.dataset.noun ?? "items";
  const total = items.length;

  const apply = () => {
    const query = search ? search.value.trim().toLowerCase() : "";
    let shown = 0;
    for (const item of items) {
      const match = !query || (item.dataset.search ?? "").includes(query);
      item.hidden = !match;
      if (match) shown++;
    }
    if (empty) empty.hidden = shown > 0;
    if (count) {
      count.textContent = shown === total ? `Showing all ${total} ${noun}` : `Showing ${shown} of ${total} ${noun}`;
    }
  };

  search?.addEventListener("input", apply);
  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    if (search) {
      search.value = "";
      search.focus();
    }
    apply();
  });

  // Pointer pill (reference/13): fine pointers only, and only while over an item.
  const label = root.dataset.pill;
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  if (label && fine.matches) {
    const pill = document.createElement("span");
    pill.className = "view-pill";
    pill.setAttribute("aria-hidden", "true");
    pill.textContent = label;
    document.body.append(pill);
    let x = 0;
    let y = 0;
    let px = 0;
    let py = 0;
    let frame = 0;
    const place = () => pill.style.setProperty("transform", `translate3d(${px}px, ${py}px, 0)`);
    const follow = () => {
      // Ease towards the pointer each frame, as OakMUN's capsule does.
      px += (x - px) * 0.18;
      py += (y - py) * 0.18;
      place();
      frame = Math.abs(x - px) + Math.abs(y - py) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    const move = (event) => {
      x = event.clientX + 18;
      y = event.clientY + 28;
      if (calm.matches) {
        px = x;
        py = y;
        place();
      } else if (!frame) {
        frame = requestAnimationFrame(follow);
      }
    };
    for (const item of items) {
      item.addEventListener("pointerenter", (event) => {
        px = event.clientX + 18;
        py = event.clientY + 28;
        move(event);
        pill.classList.add("is-on");
      });
      item.addEventListener("pointermove", move);
      item.addEventListener("pointerleave", () => pill.classList.remove("is-on"));
    }
  }
}
