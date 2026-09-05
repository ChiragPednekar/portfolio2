import { gsap, ScrollTrigger } from '../lib/gsap.js';

// Whole blocks curl away as they approach the top and bottom of the viewport.
// Independent of the slider's own bend; this one is section-level.
const readVar = (el, name, d) => {
  const v = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(v) ? v : d;
};

export function initPageBend(scope = document) {
  const items = [...scope.querySelectorAll('[data-fold]')];
  if (!items.length) return;

  items.forEach((el) => {
    const parent = el.parentElement;
    if (parent && !parent.style.perspective) {
      parent.style.perspective = `${readVar(el, '--fold-persp', 1100)}px`;
      parent.style.perspectiveOrigin = '50% 50%';
    }
    el.style.transformStyle = 'preserve-3d';

    const angle = readVar(el, '--fold-angle', 64);
    const round = readVar(el, '--fold-round', 300);
    const dir = readVar(el, '--fold-dir', -1);
    // The flat band has to be WIDE. A block is comfortably readable for most
    // of its travel, and its heading must stay legible while the reader is
    // looking at the thing it titles. Curling from 0.34 faded project names
    // to nothing well before their slider reached the middle of the screen.
    const flat = 0.72;

    let lastK = -1;
    let lastSign = 0;

    // Driven purely off ScrollTrigger's own progress. The previous version
    // called getBoundingClientRect() per element per frame and then wrote
    // styles, so every element forced a fresh layout — the main source of
    // scroll stutter once the page carried dozens of folded blocks.
    const update = (self) => {
      const d = (self.progress - 0.5) * 2;        // -1 entering .. +1 leaving
      const a = Math.abs(d);
      const k = a <= flat ? 0 : Math.min(1, (a - flat) / (1 - flat));
      const sign = d >= 0 ? 1 : -1;

      // Skip the write entirely when nothing meaningful changed.
      if (Math.abs(k - lastK) < 0.002 && sign === lastSign) return;
      lastK = k; lastSign = sign;

      if (k === 0) {
        el.style.willChange = 'auto';
        gsap.set(el, { rotateX: 0, z: 0, y: 0, opacity: 1, force3D: true });
        return;
      }
      el.style.willChange = 'transform, opacity';
      const e = k * k;
      gsap.set(el, {
        rotateX: dir * sign * angle * e,
        z: -round * k,
        y: sign * round * 0.12 * k,
        opacity: Math.max(0.45, 1 - k * 0.55),
        transformOrigin: sign > 0 ? '50% 0%' : '50% 100%',
        force3D: true,
      });
    };

    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: update,
      onRefresh: update,
    });
  });
}
