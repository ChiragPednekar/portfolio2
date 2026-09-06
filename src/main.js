// Imported explicitly and in order. A CSS @import chain gets re-ordered when
// Vite bundles multiple entries into one stylesheet, which silently flips
// which of two equal-specificity rules wins.
import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/story.css';
import './styles/work.css';
import './styles/about.css';
import { initBouncyTabs } from './motion/bouncy-tabs.js';
import { initInkbleed } from './motion/inkbleed.js';
import { initCopyEmail } from './motion/copy-email.js';
import { onResize, vp } from './lib/viewport.js';

// Start every load at the top. The browser otherwise restores the previous
// scroll position, which can drop you inside the pinned story before its
// ScrollTrigger has run — and those acts are visibility:hidden until it does.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });

const body = document.body;
body.classList.add('is-loading');

// ---- above the fold, synchronous ----------------------------------------
initBouncyTabs(document.querySelector('.hero'));
initInkbleed(document.querySelector('.hero__logo svg'));
initCopyEmail(document);

// ---- hero WebGL ----------------------------------------------------------
const stage = document.querySelector('.stage-gl');
const heroBlock = document.querySelector('.hero__title');
const heroTitle = document.querySelector('.headline-text');
const veil = document.querySelector('.nav-veil');

let grid = null;
let warp = null;
let flightST = null;

// Single source of truth for hero visibility at a given flight progress.
// This used to live only inside the trigger's onUpdate, which made it a latch:
// one transient measurement while the pins were still settling could set
// visibility:hidden and alpha 0, and nothing re-ran until the user scrolled.
function syncHero(p) {
  grid?.setFlight(p);
  const titleFade = Math.max(0, 1 - p * 3.2);
  warp?.setAlpha(titleFade);
  if (heroBlock) {
    heroBlock.style.opacity = String(titleFade);
    heroBlock.style.visibility = titleFade < 0.01 ? 'hidden' : 'visible';
  }
  grid?.setAlpha(p > 0.86 ? Math.max(0, 1 - (p - 0.86) / 0.14) : 1);
  if (veil) veil.style.opacity = p > 0.82 ? String(Math.min(1, (p - 0.82) / 0.12)) : '0';
}

function fallbackToDom() {
  body.classList.add('no-webgl');
  if (stage) stage.style.display = 'none';
  // Whatever went wrong, the headline must end up visible.
  heroTitle?.classList.remove('is-warping');
  if (heroBlock) { heroBlock.style.opacity = '1'; heroBlock.style.visibility = 'visible'; }
  body.classList.remove('is-loading');
}

// Last resort. If the hero has not come up in a few seconds — a stalled image,
// a lost context, a rejected import — show the DOM version rather than leave
// the viewport black.
const heroWatchdog = setTimeout(() => {
  if (!body.classList.contains('hero-css-on')) {
    console.warn('[hero] boot timed out, falling back to DOM');
    fallbackToDom();
  }
}, 4000);

async function bootHero() {
  if (!stage) return;
  try {
    const [{ initHeroGrid }, { initTitleWarp }] = await Promise.all([
      import('./hero/hero-grid.js'),
      import('./hero/title-warp.js'),
    ]);

    grid = await initHeroGrid(stage, { onLost: fallbackToDom });
    if (!grid) { fallbackToDom(); return; }

    if (heroTitle && !vp.reduced) {
      warp = await initTitleWarp(document.querySelector('.hero__title'), heroTitle);
    }

    stage.style.opacity = '1';
    grid.setAlpha(0);
    warp?.setAlpha(0);
    const t0 = performance.now();
    (function fadeIn(now) {
      const k = Math.min(1, (now - t0) / 600);
      grid.setAlpha(k);
      warp?.setAlpha(k);
      if (k < 1) requestAnimationFrame(fadeIn);
    })(t0);

    clearTimeout(heroWatchdog);
    body.classList.add('hero-css-on');
    // bootHero can resolve after bootRest has already built the flight
    // trigger, so adopt the current scroll state rather than whatever the
    // fade-in left behind.
    syncHero(flightST ? flightST.progress : 0);
  } catch (e) {
    console.warn('[hero]', e);
    fallbackToDom();
  } finally {
    body.classList.remove('is-loading');
  }
}

// ---- everything past the hero, lazily -----------------------------------
let booted = false;
async function bootRest() {
  if (booted) return;
  booted = true;

  const { initScroll, gsap, ScrollTrigger } = await import('./lib/scroll.js');
  initScroll();

  const [
    { initHighlightText },
    { initPageBend },
    { initElasticPulse },
    { initFeatured },
    { initAbout },
    { initOutro },
  ] = await Promise.all([
    import('./motion/highlight-text.js'),
    import('./motion/fold-mode.js'),
    import('./motion/elastic-pulse.js'),
    import('./motion/featured.js'),
    import('./motion/about.js'),
    import('./motion/outro.js'),
  ]);

  initHighlightText(document);
  initPageBend(document);
  initElasticPulse(document);
  initFeatured(document.querySelector('.section--featured'));
  initAbout(document.querySelector('.about'));
  initOutro(document.querySelector('.outro'));

  const [{ initStory }, { initWork }] = await Promise.all([
    import('./story/story.js'),
    import('./work/work.js'),
  ]);
  initStory(document.querySelector('.section--focus'));
  initWork(document.querySelector('.section--work'));

  // The flight spacer drives the hero dolly and hands off through the veil.
  const flight = document.querySelector('.flight');
  if (flight) {
    flightST = ScrollTrigger.create({
      trigger: flight,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => syncHero(self.progress),
      // Re-applied after every measurement, so a refresh can never leave the
      // hero latched hidden.
      onRefresh: (self) => syncHero(self.progress),
      onLeave: () => { if (veil) veil.style.opacity = '0'; },
    });
  }

  ScrollTrigger.refresh();
}

const kick = () => bootRest();
window.addEventListener('wheel', kick, { once: true, passive: true });
window.addEventListener('touchstart', kick, { once: true, passive: true });
window.addEventListener('load', kick, { once: true });

bootHero();

// Smooth anchor jumps through Lenis when it exists.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = id && document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  bootRest().then(async () => {
    const { lenis } = await import('./lib/scroll.js');
    lenis ? lenis.scrollTo(el, { offset: -40 }) : el.scrollIntoView({ behavior: 'smooth' });
  });
});

onResize(() => {}, false);
