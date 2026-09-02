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
    el.style.willChange = 'transform, opacity';

    const angle = readVar(el, '--fold-angle', 64);
    const round = readVar(el, '--fold-round', 300);
    const zone = readVar(el, '--fold-zone', 150);
    const fadeIn = readVar(el, '--fold-fade-in', 380);
    const fadeOut = readVar(el, '--fold-fade-out', 1000);
    const dir = readVar(el, '--fold-dir', -1);

    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const mid = r.top + r.height / 2;

      // Signed distance past each edge, normalised over the fold zone.
      const overTop = Math.max(0, zone - r.bottom) / Math.max(zone, 1);
      const overBot = Math.max(0, r.top - (vh - zone)) / Math.max(zone, 1);
      const top = Math.min(1, Math.max(0, (vh * 0.28 - r.top) / (vh * 0.6)));
      const bot = Math.min(1, Math.max(0, (r.bottom - vh * 0.72) / (vh * 0.6)));

      let t = 0;
      let sign = 1;
      if (mid < vh / 2) { t = top; sign = 1; }
      else { t = bot; sign = -1; }
      t = Math.min(1, Math.max(0, t));

      const rot = dir * sign * angle * t * t;
      const z = -round * t;
      const y = sign * round * 0.12 * t;

      const fade = mid < vh / 2
        ? 1 - Math.min(1, Math.max(0, (fadeIn - r.bottom) / Math.max(fadeIn, 1)))
        : 1 - Math.min(1, Math.max(0, (r.top - (vh - fadeOut)) / Math.max(fadeOut, 1)) * 0.85);

      gsap.set(el, {
        rotateX: rot,
        z,
        y,
        opacity: Math.min(1, Math.max(0.05, fade)),
        transformOrigin: sign > 0 ? '50% 100%' : '50% 0%',
        force3D: true,
      });
    };

    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom+=10%',
      end: 'bottom top-=10%',
      onUpdate: update,
      onRefresh: update,
    });
    update();
  });
}
