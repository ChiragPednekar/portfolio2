import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { splitLetters } from './letters.js';

// Reuses the letter primitives from the focus acts — the band is deliberately thin.
export function initFeatured(section) {
  const title = section?.querySelector('.featured__title');
  if (!title) return;
  const letters = splitLetters(title);
  gsap.set(letters, { yPercent: 120, opacity: 0 });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 78%',
    once: true,
    onEnter: () => {
      gsap.timeline()
        .to(letters, {
          yPercent: 0,
          opacity: 1,
          duration: 1.05,
          ease: 'expo.out',
          stagger: { each: 0.022, from: 'start' },
        })
        .to(letters, { scale: 1, duration: 0.7, ease: 'back.out(0.9)', stagger: 0.014 }, '-=0.6');
    },
  });
}
