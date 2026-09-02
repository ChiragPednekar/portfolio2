import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { onResize } from '../lib/viewport.js';

// FLIP-style measure-and-tween pill. The kill-before-tween is what stops the
// jitter when the pointer crosses several tabs quickly.
export function initBouncyTabs(root) {
  const nav = root.querySelector('[data-bouncy-tabs-nav]');
  if (!nav) return;
  const pill = nav.querySelector('[data-bouncy-tabs-indicator]');
  const ghost = nav.querySelector('[data-bouncy-tabs-ghost]');
  const buttons = [...nav.querySelectorAll('[data-bouncy-tabs-button]')];
  if (!buttons.length) return;

  let active = buttons.findIndex((b) => b.hasAttribute('data-active'));
  if (active < 0) active = 0;

  const rectOf = (el) => {
    const a = el.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    return { x: a.left - b.left, w: a.width, h: a.height };
  };

  function place(el, immediate = false) {
    const r = rectOf(el);
    gsap.killTweensOf(pill);
    gsap.set(pill, { height: r.h, transformOrigin: '50% 50%' });
    if (immediate) {
      gsap.set(pill, { x: r.x, width: r.w });
    } else {
      gsap.to(pill, { x: r.x, width: r.w, duration: 0.62, ease: 'back.out(2)' });
    }
  }

  function setActive(i, immediate = false) {
    if (i < 0 || i >= buttons.length) return;
    active = i;
    buttons.forEach((b, k) => {
      b.toggleAttribute('data-active', k === i);
      if (k === i) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    place(buttons[i], immediate);
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('pointerenter', () => {
      const r = rectOf(btn);
      gsap.killTweensOf(ghost);
      gsap.set(ghost, { visibility: 'visible', height: r.h });
      gsap.to(ghost, { x: r.x, width: r.w, duration: 0.55, ease: 'back.out(2.5)' });
      gsap.to(ghost, { opacity: 1, duration: 0.22, ease: 'power1.out' });
    });
    btn.addEventListener('click', () => setActive(i));
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      setActive(next);
      buttons[next].click();
    });
  });

  nav.addEventListener('pointerleave', () => {
    gsap.killTweensOf(ghost);
    gsap.to(ghost, {
      opacity: 0,
      duration: 0.24,
      ease: 'power1.out',
      onComplete: () => gsap.set(ghost, { visibility: 'hidden' }),
    });
  });

  setActive(active, true);
  onResize(() => place(buttons[active], true), false);

  // Keep the pill honest about where the reader actually is.
  buttons.forEach((btn, i) => {
    const id = btn.getAttribute('aria-controls');
    const section = id && document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => { if (self.isActive) setActive(i); },
    });
  });
}
