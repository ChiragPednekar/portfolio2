import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/case.css';
import { initInkbleed } from './motion/inkbleed.js';
import { initCopyEmail } from './motion/copy-email.js';
import { initElasticPulse } from './motion/elastic-pulse.js';

initInkbleed(document.querySelector('.hero__logo svg'));
initCopyEmail(document);
initElasticPulse(document);
document.body.classList.remove('is-loading');

// Case pages are short, so they get smooth scroll without the full motion stack.
(async () => {
  const { initScroll } = await import('./lib/scroll.js');
  initScroll();
  const { initHighlightText } = await import('./motion/highlight-text.js');
  initHighlightText(document);
})();
