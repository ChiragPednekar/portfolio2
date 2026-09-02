import { gsap, ScrollTrigger } from '../lib/gsap.js';

// Full-bleed portrait scales 1 -> --about-zoom across the section's scroll.
export function initAbout(section) {
  const photo = section?.querySelector('.about__photo');
  if (!photo) return;
  const zoom = parseFloat(getComputedStyle(section).getPropertyValue('--about-zoom')) || 1.16;
  gsap.fromTo(photo,
    { scale: 1 },
    {
      scale: zoom,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

  const sign = section.querySelector('.about__sign');
  if (sign) {
    gsap.fromTo(sign,
      { opacity: 0, y: 30, rotate: -3 },
      {
        opacity: 1, y: 0, rotate: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: sign, start: 'top 82%', once: true },
      });
  }
}
