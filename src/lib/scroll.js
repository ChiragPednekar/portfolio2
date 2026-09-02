import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';

export let lenis = null;

export function initScroll() {
  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  // Drive Lenis from GSAP's ticker so scroll and tweens share one clock.
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // The lightbox needs scroll frozen while it is open.
  window.addEventListener('lightbox:toggle', (e) => {
    if (e.detail?.open) { lenis.stop(); document.documentElement.classList.add('is-locked'); }
    else { lenis.start(); document.documentElement.classList.remove('is-locked'); }
  });

  // Dev-only handle so the scroll position can be driven from the console /
  // automated checks. Stripped from production builds by Vite.
  if (import.meta.env?.DEV) window.__lenis = lenis;

  return lenis;
}

export { gsap, ScrollTrigger };
