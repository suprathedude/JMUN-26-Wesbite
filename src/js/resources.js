// Resources: the International Press card opens and closes the list of its style guides
// (Journalism, Photography). The whole card is the button. Without this script the guides
// are always shown.
const root = document.querySelector("[data-ip]");

if (root) {
  const toggle = root.querySelector("[data-ip-toggle]");
  const label = root.querySelector("[data-ip-label]");
  const panel = root.querySelector("[data-ip-panel]");
  const show = label.textContent;
  const hide = "Hide the guides";

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("is-open", open);
    label.textContent = open ? hide : show;
  });

  // Keep the guides closed until asked for, now that the button works.
  root.classList.add("is-ready");
}
