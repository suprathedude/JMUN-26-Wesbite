// Lenis smooth scrolling, only for mice and trackpads and never with reduced motion
// (SPEC 5). Settings are OakMUN's. Lenis comes from /js/vendor via the import map.

const finePointer = matchMedia("(pointer: fine)").matches;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (finePointer && !reducedMotion) {
  import("lenis")
    .then(({ default: Lenis }) => {
      const lenis = new Lenis({
        lerp: 0.11,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        autoRaf: true,
        anchors: { offset: -110 },
      });
      // The mobile sheet locks the page while it's open.
      window.addEventListener("nav:lock", () => lenis.stop());
      window.addEventListener("nav:unlock", () => lenis.start());
    })
    .catch(() => {
      // Without import maps (very old browsers) the page simply scrolls natively.
    });
}
