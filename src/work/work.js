import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { initSlider } from './slider.js';
import { initNameBend } from './name-bend.js';
import { initLightbox } from './lightbox.js';
import { initElasticPulse } from '../motion/elastic-pulse.js';

export function initWork(section) {
  if (!section) return;

  const sliders = [...section.querySelectorAll('.work__slider')].map(initSlider).filter(Boolean);
  initNameBend(section);
  initElasticPulse(section);
  initLightbox(document.querySelector('.tile-view'));

  // Each item's head rises as the item enters; the slider bend is scrub-linked.
  section.querySelectorAll('.work__item').forEach((item, i) => {
    const head = item.querySelector('.work__head');
    if (head) {
      gsap.fromTo(head,
        { y: 48, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 72%', once: true },
        });
    }
    const slider = sliders[i];
    if (slider) {
      ScrollTrigger.create({
        trigger: item,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: () => slider.bend(),
        onRefresh: () => slider.measure(),
      });
    }
  });

  return () => sliders.forEach((s) => s.destroy());
}
