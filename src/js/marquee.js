// Committee marquees: paused when off-screen or when the tab is hidden (SPEC 3.4).
// The movement itself is a CSS animation; reduced motion turns it off in CSS.
const strips = document.querySelectorAll("[data-marquee]");

if (strips.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.classList.toggle("is-paused", !entry.isIntersecting);
  });
  for (const strip of strips) observer.observe(strip);

  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle("tab-hidden", document.hidden);
  });
}
