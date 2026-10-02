// Committees listing (SPEC 9.2): category chips and search filter the tiles instantly, and
// the number of results is announced to screen readers. The chosen category is kept in the
// address (?category=Crisis) so a filtered view can be shared. Also runs the "View
// committee" pill that follows the pointer over the tiles (reference/13).
const root = document.querySelector("[data-filters]");

if (root) {
  const chips = [...root.querySelectorAll("[data-filter]")];
  const search = root.querySelector("[data-search]");
  const tiles = [...root.querySelectorAll(".tile")];
  const count = root.querySelector("[data-count]");
  const empty = root.querySelector("[data-empty]");
  const total = tiles.length;
  let category = "all";

  const apply = ({ announce = true } = {}) => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    for (const tile of tiles) {
      const match =
        (category === "all" || tile.dataset.category === category) && (!query || tile.dataset.search.includes(query));
      tile.hidden = !match;
      if (match) shown++;
    }
    empty.hidden = shown > 0;
    if (announce) count.textContent = shown === total ? `Showing all ${total} committees` : `Showing ${shown} of ${total} committees`;
  };

  const choose = (value, { announce = true } = {}) => {
    category = chips.some((chip) => chip.dataset.filter === value) ? value : "all";
    for (const chip of chips) chip.setAttribute("aria-pressed", String(chip.dataset.filter === category));
    const url = new URL(location.href);
    if (category === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", category);
    history.replaceState(null, "", url);
    apply({ announce });
  };

  for (const chip of chips) chip.addEventListener("click", () => choose(chip.dataset.filter));
  search.addEventListener("input", () => apply());
  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    search.value = "";
    choose("all");
    chips[0].focus();
  });

  choose(new URL(location.href).searchParams.get("category") ?? "all", { announce: false });

  // "View committee" pill: fine pointers only, and only while the pointer is over a tile.
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  if (fine.matches) {
    const pill = document.createElement("span");
    pill.className = "view-pill";
    pill.setAttribute("aria-hidden", "true");
    pill.textContent = "View committee";
    document.body.append(pill);
    let x = 0;
    let y = 0;
    let px = 0;
    let py = 0;
    let frame = 0;
    const place = () => pill.style.setProperty("transform", `translate3d(${px}px, ${py}px, 0)`);
    const follow = () => {
      // Ease towards the pointer (OakMUN uses a factor of 0.09 per frame).
      px += (x - px) * 0.09 * 2;
      py += (y - py) * 0.09 * 2;
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
    for (const tile of tiles) {
      tile.addEventListener("pointerenter", (event) => {
        px = event.clientX + 18;
        py = event.clientY + 28;
        move(event);
        pill.classList.add("is-on");
      });
      tile.addEventListener("pointermove", move);
      tile.addEventListener("pointerleave", () => pill.classList.remove("is-on"));
    }
  }
}
