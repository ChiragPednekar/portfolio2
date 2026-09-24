// The nav's "Get in touch" opens a small panel with the two ways to reach
// Afeef, rather than firing a mailto: the moment it is pressed. A mailto is a
// dead end for anyone without a mail client configured; showing the address and
// the number lets them read, tap, or copy by hand.
export function initContactMenu(scope = document) {
  const root = scope.querySelector('[data-contact]');
  if (!root) return;
  const toggle = root.querySelector('[data-contact-toggle]');
  const menu = root.querySelector('[data-contact-menu]');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    // `hidden` rather than a class, so the panel is out of the accessibility
    // tree and out of the tab order while closed.
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
  };

  const close = ({ focus = false } = {}) => {
    if (menu.hidden) return;
    setOpen(false);
    if (focus) toggle.focus();
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });

  // Anywhere outside closes it. Capture phase so a click on some other control
  // still gets to run — this only closes, it never swallows the event.
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close({ focus: true });
  });

  // Following either link navigates away (mail client, dialler) or, on desktop,
  // may do nothing visible at all. Close either way so the panel is not left
  // hanging open behind them.
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => close()));

  // A pinned nav that scrolls out from under an open panel looks broken.
  window.addEventListener('scroll', () => close(), { passive: true });

  setOpen(false);
}
