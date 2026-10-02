// Category chips (and an optional search box) that filter a grid instantly, with the number
// of results announced to screen readers (SPEC 9.2 and 9.6). Used on the committees listing
// and for the background guides on Resources.
//
// Markup: a [data-filters] block holding [data-filter] chips, optionally a [data-search]
// input, a [data-count] live region, a [data-empty] message, and [data-item] elements with
// data-category (and data-search text). Options on [data-filters]:
//   data-noun="committees"   used in "Showing 3 of 12 committees"
//   data-param="category"    keep the chosen chip in the address (?category=Crisis)
//   data-pill="View committee"  a pill that follows the pointer over the items
for (const root of document.querySelectorAll("[data-filters]")) {
  const chips = [...root.querySelectorAll("[data-filter]")];
  const search = root.querySelector("[data-search]");
  const items = [...root.querySelectorAll("[data-item]")];
  const count = root.querySelector("[data-count]");
  const empty = root.querySelector("[data-empty]");
  const noun = root.dataset.noun ?? "items";
  const param = root.dataset.param;
  const total = items.length;
  let category = "all";

  const apply = ({ announce = true } = {}) => {
    const query = search ? search.value.trim().toLowerCase() : "";
    let shown = 0;
    for (const item of items) {
      const match =
        (category === "all" || item.dataset.category === category) &&
        (!query || (item.dataset.search ?? "").includes(query));
      item.hidden = !match;
      if (match) shown++;
    }
    if (empty) empty.hidden = shown > 0;
    if (announce && count) {
      count.textContent = shown === total ? `Showing all ${total} ${noun}` : `Showing ${shown} of ${total} ${noun}`;
    }
  };

  const choose = (value, { announce = true } = {}) => {
    category = chips.some((chip) => chip.dataset.filter === value) ? value : "all";
    for (const chip of chips) chip.setAttribute("aria-pressed", String(chip.dataset.filter === category));
    if (param) {
      const url = new URL(location.href);
      if (category === "all") url.searchParams.delete(param);
      else url.searchParams.set(param, category);
      history.replaceState(null, "", url);
    }
    apply({ announce });
  };

  for (const chip of chips) chip.addEventListener("click", () => choose(chip.dataset.filter));
  search?.addEventListener("input", () => apply());
  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    if (search) search.value = "";
    choose("all");
    chips[0]?.focus();
  });

  choose((param && new URL(location.href).searchParams.get(param)) || "all", { announce: false });

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
