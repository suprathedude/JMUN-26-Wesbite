// Lenis smooth scrolling, only for mice and trackpads and never with reduced motion
// (SPEC 5). Settings are OakMUN's. Lenis comes from /js/vendor via the import map.
//
// Lenis only runs while it's moving the page (16 October). Its own loop (autoRaf) asked for a
// frame 60 times a second for as long as the page was open, so the browser redrew a page nobody
// was touching. Now a wheel turn or a click wakes it, and it sleeps again once the page settles.

const finePointer = matchMedia("(pointer: fine)").matches;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (finePointer && !reducedMotion) {
  import("lenis")
    .then(({ default: Lenis }) => {
      const lenis = new Lenis({
        lerp: 0.11,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        anchors: { offset: -110 },
      });

      let raf = 0;
      const frame = (time) => {
        lenis.raf(time);
        raf = lenis.isScrolling === "smooth" ? requestAnimationFrame(frame) : 0;
      };
      const wake = () => {
        if (raf) return;
        lenis.time = 0; // so the first frame after a rest doesn't jump the whole way at once
        raf = requestAnimationFrame(frame);
      };
      // Lenis's own listeners were added first, so by now it knows where it's heading.
      addEventListener("wheel", wake, { passive: true });
      addEventListener("click", wake); // links to a #section, which Lenis scrolls to

      // The mobile sheet locks the page while it's open.
      window.addEventListener("nav:lock", () => lenis.stop());
      window.addEventListener("nav:unlock", () => lenis.start());
    })
    .catch(() => {
      // Without import maps (very old browsers) the page simply scrolls natively.
    });
}
