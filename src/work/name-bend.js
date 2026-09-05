import { gsap } from 'gsap';
import { splitLetters } from '../motion/letters.js';

// A skew/rotate wave rides across the characters from the hovered position out.
export function initNameBend(scope = document) {
  scope.querySelectorAll('[data-bend]').forEach((link) => {
    if (link.dataset.bendReady) return;
    link.dataset.bendReady = '1';
    const letters = splitLetters(link);
    if (!letters.length) return;

    // pointermove fires far faster than the display refreshes. Without this
    // rAF throttle every event spawned a tween per letter, so a long name
    // could queue hundreds of overlapping tweens during one hover.
    let queued = 0, lastX = 0, rect = null;
    link.addEventListener('pointerenter', () => { rect = link.getBoundingClientRect(); });
    link.addEventListener('pointermove', (e) => {
      lastX = e.clientX;
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        const b = rect || link.getBoundingClientRect();
        const px = (lastX - b.left) / Math.max(b.width, 1);
        apply(px);
      });
    });

    function apply(px) {
      letters.forEach((l, i) => {
        const d = Math.abs(i / Math.max(letters.length - 1, 1) - px);
        const f = Math.max(0, 1 - d * 3.2);
        gsap.to(l, {
          y: -14 * f,
          skewX: -10 * f * (i / letters.length - px > 0 ? 1 : -1),
          rotate: 6 * f * (i / letters.length - px > 0 ? 1 : -1),
          duration: 0.45,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      });
    }

    link.addEventListener('pointerleave', () => {
      if (queued) { cancelAnimationFrame(queued); queued = 0; }
      gsap.to(letters, {
        y: 0, skewX: 0, rotate: 0,
        duration: 0.75, ease: 'elastic.out(1, 0.5)',
        stagger: { each: 0.012, from: 'center' },
        overwrite: 'auto',
      });
    });
  });
}
