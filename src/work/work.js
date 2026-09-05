import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { initSlider } from './slider.js';
import { initNameBend } from './name-bend.js';
import { initLightbox } from './lightbox.js';
import { initElasticPulse } from '../motion/elastic-pulse.js';
import { vp } from '../lib/viewport.js';

// The other-work strip is worth more than the single screen it used to get.
// Pin it for a couple of viewport heights and light the three rows in turn, so
// the hold reads as deliberate rather than as a stall.
function initOtherStrip() {
  const section = document.querySelector('.section--other');
  const inner = section?.querySelector('.other__inner');
  const rows = inner ? [...inner.querySelectorAll('.other__item')] : [];
  if (!inner || !rows.length) return;

  if (vp.reduced) {
    rows.forEach((r) => r.classList.add('is-lit'));
    return;
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=250%',
    pin: inner,
    pinSpacing: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      rows.forEach((r, i) => {
        // Each row lights in sequence and stays lit for the rest of the hold.
        r.classList.toggle('is-lit', p >= (i / rows.length) * 0.75 + 0.06);
      });
    },
    onLeaveBack: () => rows.forEach((r) => r.classList.remove('is-lit')),
  });
}

export function initWork(section) {
  if (!section) return;

  const sliders = [...section.querySelectorAll('.work__slider')].map(initSlider).filter(Boolean);
  initNameBend(section);
  initElasticPulse(section);
  initLightbox(document.querySelector('.tile-view'));
  initOtherStrip();

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
