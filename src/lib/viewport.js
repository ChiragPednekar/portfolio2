// One shared resize bus. Every module subscribes here instead of adding its own
// resize listener, so a window drag costs one measure pass, not N.
const subs = new Set();
let raf = 0;

export const vp = { w: 0, h: 0, dpr: 1, coarse: false, reduced: false };

function measure() {
  vp.w = window.innerWidth;
  vp.h = window.innerHeight;
  vp.dpr = Math.min(window.devicePixelRatio || 1, 2);
  vp.coarse = window.matchMedia('(pointer: coarse)').matches;
  vp.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function flush() {
  raf = 0;
  measure();
  for (const fn of subs) fn(vp);
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(flush);
}

measure();
window.addEventListener('resize', schedule, { passive: true });
window.addEventListener('orientationchange', schedule, { passive: true });

export function onResize(fn, fire = true) {
  subs.add(fn);
  if (fire) fn(vp);
  return () => subs.delete(fn);
}

const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
export function onMotionPref(fn) {
  const handler = () => { measure(); fn(rm.matches); };
  rm.addEventListener('change', handler);
  return () => rm.removeEventListener('change', handler);
}

// Prefetch observer — fires early so images decode before they scroll in.
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.dispatchEvent(new CustomEvent('near'));
        io.unobserve(e.target);
      }
    }
  },
  { rootMargin: '25% 0px' }
);
export function observeNear(el, fn) {
  el.addEventListener('near', fn, { once: true });
  io.observe(el);
}
