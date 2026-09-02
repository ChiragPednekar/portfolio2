import { gsap, ScrollTrigger } from '../lib/gsap.js';

// Horizontal marquee coupled to scroll velocity: it speeds up with the scroll
// and flips direction when the reader reverses.
export function initOutro(section) {
  if (!section) return;
  const roll = section.querySelector('.outro__roll');
  if (roll) {
    const inner = roll.firstElementChild;
    if (inner) {
      // Duplicate until the strip comfortably overflows, so the loop is seamless.
      const original = inner.innerHTML;
      for (let i = 0; i < 3; i++) inner.innerHTML += original;
      const half = () => inner.scrollWidth / 2;

      let x = 0;
      let dir = 1;
      let speed = 60;

      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity();
          if (Math.abs(v) > 40) dir = v > 0 ? 1 : -1;
          speed = 60 + Math.min(900, Math.abs(v) * 0.35);
        },
      });

      gsap.ticker.add((_, dt) => {
        const w = half();
        if (!w) return;
        x -= dir * speed * (dt / 1000);
        if (x <= -w) x += w;
        if (x >= 0) x -= w;
        gsap.set(inner, { x });
      });
    }
  }

  const title = section.querySelector('.outro__title');
  if (title) {
    gsap.fromTo(title,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: title, start: 'top 85%', once: true },
      });
  }
}
