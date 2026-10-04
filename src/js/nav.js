// Announcement strip, nav collapse on scroll, the "More" dropdown and the mobile sheet.
// Loaded on every page. SPEC 8.1 and 8.2.

const root = document.documentElement;
const nav = document.querySelector("[data-nav]");

const STRIP_KEY = "oakjmun-strip";
const COLLAPSE_AFTER = 80; // px scrolled before the pill may collapse
const CLOSE_DELAY = 550; // ms before the dropdown closes after the pointer leaves

const desktop = matchMedia("(min-width: 769px)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

function initStrip() {
  const strip = document.querySelector("[data-strip]");
  const close = strip?.querySelector("[data-strip-close]");
  if (!close) return;
  close.addEventListener("click", () => {
    root.classList.add("strip-off");
    try {
      sessionStorage.setItem(STRIP_KEY, strip.dataset.key);
    } catch {
      // Storage can be blocked; the strip still closes for this page view.
    }
    document.getElementById("main")?.focus({ preventScroll: true });
  });
}

function initCollapse() {
  const crest = nav.querySelector("[data-nav-crest]");
  let collapsed = false;
  let openedByHover = false;
  let lastY = window.scrollY;
  let queued = false;

  const setCollapsed = (on) => {
    if (on === collapsed) return;
    collapsed = on;
    nav.classList.toggle("is-collapsed", on);
    // The crest is only a control while the pill is collapsed.
    crest.tabIndex = on ? 0 : -1;
    crest.setAttribute("aria-hidden", String(!on));
    if (on) crest.setAttribute("aria-expanded", "false");
    else crest.removeAttribute("aria-expanded");
  };

  // Never hide the links while someone is using them. Only keyboard focus counts: a mouse
  // click leaves focus on the link, and that shouldn't pin the pill open.
  const busy = () =>
    nav.querySelector(":focus-visible") !== null ||
    root.classList.contains("is-locked") ||
    nav.querySelector(".nav__more.is-open") !== null;

  const update = () => {
    queued = false;
    const y = Math.max(0, window.scrollY);
    const delta = y - lastY;
    lastY = y;
    if (!desktop.matches || y <= COLLAPSE_AFTER) {
      openedByHover = false;
      setCollapsed(false);
    } else if (delta > 2 && !busy() && !openedByHover) {
      setCollapsed(true);
    } else if (delta < -2) {
      openedByHover = false;
      setCollapsed(false);
    }
  };

  // While the page scrolls, html.is-scrolling holds the drifting glows still (components.css),
  // so nothing animates behind the content as it moves.
  let settle = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
      if (!settle) root.classList.add("is-scrolling");
      clearTimeout(settle);
      settle = setTimeout(() => {
        settle = 0;
        root.classList.remove("is-scrolling");
      }, 200);
    },
    { passive: true },
  );
  desktop.addEventListener("change", update);

  crest.addEventListener("click", (event) => {
    if (!collapsed) return;
    setCollapsed(false);
    // Keyboard users land on the first link rather than on a crest that's gone decorative.
    if (event.detail === 0) nav.querySelector(".nav__side a, .nav__side button")?.focus();
  });

  // On desktop, hovering the compact crest opens the pill until the pointer leaves the nav.
  crest.addEventListener("pointerenter", () => {
    if (collapsed && finePointer.matches) {
      openedByHover = true;
      setCollapsed(false);
    }
  });
  nav.addEventListener("pointerleave", () => {
    if (!openedByHover) return;
    openedByHover = false;
    if (window.scrollY > COLLAPSE_AFTER && !busy()) setCollapsed(true);
  });
}

function initMore() {
  const more = nav.querySelector("[data-more]");
  const button = more?.querySelector("[data-more-btn]");
  if (!button) return;
  let timer = 0;
  let pinned = false; // opened by a click or Enter, so it stays open until closed the same way
  let ignoreFocus = false;

  const isOpen = () => more.classList.contains("is-open");
  const open = () => {
    clearTimeout(timer);
    more.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    clearTimeout(timer);
    pinned = false;
    more.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  };

  more.addEventListener("pointerenter", () => {
    if (finePointer.matches) open();
  });
  more.addEventListener("pointerleave", () => {
    if (finePointer.matches && !pinned) timer = setTimeout(close, CLOSE_DELAY);
  });
  more.addEventListener("focusin", () => {
    if (!ignoreFocus) open();
  });
  more.addEventListener("focusout", (event) => {
    if (!more.contains(event.relatedTarget)) close();
  });
  button.addEventListener("click", () => {
    if (isOpen() && pinned) {
      close();
    } else {
      open();
      pinned = true;
    }
  });
  more.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen()) return;
    close();
    ignoreFocus = true;
    button.focus();
    ignoreFocus = false;
  });
  document.addEventListener("pointerdown", (event) => {
    if (isOpen() && !more.contains(event.target)) close();
  });
}

function initSheet() {
  const button = nav.querySelector("[data-menu-btn]");
  const sheet = document.querySelector("[data-sheet]");
  if (!button || !sheet) return;
  const outside = [
    document.querySelector(".skip-link"),
    document.querySelector("[data-strip]"),
    document.getElementById("main"),
    document.querySelector(".footer"),
  ].filter(Boolean);
  let isOpen = false;

  const focusable = () => [...sheet.querySelectorAll("a[href], button:not([disabled])")];

  const setOpen = (on, { returnFocus = true } = {}) => {
    if (on === isOpen) return;
    isOpen = on;
    sheet.classList.toggle("is-open", on);
    sheet.inert = !on;
    button.setAttribute("aria-expanded", String(on));
    button.setAttribute("aria-label", on ? "Close menu" : "Open menu");
    root.classList.toggle("is-locked", on);
    for (const el of outside) el.inert = on;
    window.dispatchEvent(new CustomEvent(on ? "nav:lock" : "nav:unlock"));
    if (on) focusable()[0]?.focus();
    else if (returnFocus) button.focus();
  };

  button.addEventListener("click", () => setOpen(!isOpen));

  // Following a link closes the sheet (it matters for /#faq on the homepage).
  sheet.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) setOpen(false, { returnFocus: false });
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen) return;
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    // Focus trap: the menu button plus everything in the sheet.
    const items = [button, ...focusable()];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!items.includes(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  });

  // Widening the window past the tablet range closes the sheet.
  matchMedia("(min-width: 1250px)").addEventListener("change", (mq) => {
    if (mq.matches) setOpen(false, { returnFocus: false });
  });
}

initStrip();
if (nav) {
  initCollapse();
  initMore();
  initSheet();
}
