import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/work.css';
import './styles/case.css';

import { initInkbleed } from './motion/inkbleed.js';
import { initCopyEmail } from './motion/copy-email.js';
import { initElasticPulse } from './motion/elastic-pulse.js';

initInkbleed(document.querySelector('.hero__logo svg'));
initCopyEmail(document);
initElasticPulse(document);
document.body.classList.remove('is-loading');

(async () => {
  const { initScroll } = await import('./lib/scroll.js');
  initScroll();

  const { initHighlightText } = await import('./motion/highlight-text.js');
  initHighlightText(document);

  // The Other Work page carries real sliders, so it needs the same drag,
  // inertia and lightbox wiring the homepage gets.
  const sliders = document.querySelectorAll('.work__slider');
  if (sliders.length) {
    const [{ initSlider }, { initLightbox }, { ScrollTrigger }] = await Promise.all([
      import('./work/slider.js'),
      import('./work/lightbox.js'),
      import('./lib/gsap.js'),
    ]);
    const made = [...sliders].map(initSlider).filter(Boolean);
    initLightbox(document.querySelector('.tile-view'));
    made.forEach((s, i) => {
      ScrollTrigger.create({
        trigger: sliders[i],
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: () => s.bend(),
        onRefresh: () => s.measure(),
      });
    });
    ScrollTrigger.refresh();
  }
})();
