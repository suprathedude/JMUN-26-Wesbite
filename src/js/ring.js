// "Committees at a glance" ring (6 October): loads the React island
// (src/islands/committee-ring.tsx, bundled to /js/committee-ring.js) as the section comes within
// a screen of view, and hands it the committee cards from the page. Once it's up, the plain list
// is hidden (html: .ring.has-ring). Without the script, with reduced motion, or if the island
// fails to load, the list stays.
const ring = document.querySelector("[data-ring]");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (ring && !calm && "IntersectionObserver" in window) {
  let items = [];
  try {
    // Photo paths are relative to the page, so they work wherever the site is served from.
    items = JSON.parse(ring.querySelector("[data-ring-items]").textContent).map((item) => ({
      ...item,
      photo: { ...item.photo, url: item.photo.url ? new URL(item.photo.url, document.baseURI).href : "" },
    }));
  } catch {
    items = [];
  }

  if (items.length) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        import(new URL(ring.dataset.bundle, document.baseURI).href)
          .then(({ mount }) => {
            mount(ring.querySelector("[data-ring-root]"), items);
            ring.classList.add("has-ring");
          })
          .catch(() => {
            // The list stays.
          });
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(ring);
  }
}
