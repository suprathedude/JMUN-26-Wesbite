// Schedule day tabs (ARIA tabs pattern, automatic activation) and the timeline entrance:
// rows slide in once per day, the first time that day is shown (SPEC 9.1, item 7).
const section = document.querySelector("[data-schedule]");

if (section) {
  const tabs = [...section.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const entered = new Set();

  const enter = (panel) => {
    if (calm || entered.has(panel)) return;
    entered.add(panel);
    panel.querySelectorAll(".tl-item").forEach((item, i) => {
      item.style.transitionDelay = `${i * 60}ms`;
      item.classList.add("is-in");
    });
  };

  const select = (index, moveFocus = false) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].toggleAttribute("data-inactive", !on);
    });
    if (moveFocus) tabs[index].focus();
    enter(panels[index]);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", (event) => {
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  });

  if (!calm && "IntersectionObserver" in window) {
    section.classList.add("is-entering");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        enter(panels[tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true")]);
      },
      { threshold: 0.15 },
    );
    observer.observe(section);
  }
}
