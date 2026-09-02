import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

// Words light from dim to bright as the sentence scrubs past. Deliberately tiny.
export function initHighlightText(scope = document) {
  scope.querySelectorAll('[data-highlight-text]').forEach((el) => {
    if (el.dataset.hlReady) return;
    el.dataset.hlReady = '1';
    const split = new SplitText(el, { type: 'words', wordsClass: 'hl-word' });
    const bright = el.dataset.highlightColor || '#eafdff';
    gsap.set(split.words, { color: '#3a3a3a' });
    gsap.to(split.words, {
      color: bright,
      ease: 'none',
      stagger: 1,
      scrollTrigger: {
        trigger: el,
        start: 'top 65%',
        end: el.hasAttribute('data-highlight-scroll-end') ? 'bottom 45%' : 'bottom 60%',
        scrub: true,
      },
    });
  });
}
