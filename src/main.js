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

// ---- scroll restoration --------------------------------------------------
// The browser's own restoration cannot work on this page. It re-applies the
// old offset during parse, long before `js-ready` grows the story section from
// one screen to nineteen and before ScrollTrigger has measured a 28,000px
// document full of pins — so the offset it restores lands on completely
// different content, inside pinned sections whose triggers have not run yet.
// Those sections are autoAlpha 0 until their trigger runs: a black screen that
// only repairs itself once you scroll back to the top and come down again.
//
// So we turn it off and do it ourselves, once, after the page is fully
// measured. `restoreScroll` at the end of bootRest is the other half.
const SCROLL_KEY = 'afeef:y';
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

let savedY = 0;
try {
  savedY = Math.max(0, parseFloat(sessionStorage.getItem(SCROLL_KEY)) || 0);
} catch { savedY = 0; }

// `js-ready` has to go on NOW, not when initStory eventually runs. It is what
// gives .section--focus its nineteen viewports and .section--other its 350svh,
// and until it is applied the document is a fraction of its real height — so a
// restored offset points at the wrong content, or past the end entirely. With
// it applied up front the document is its final height in the very first frame,
// before a single image has loaded, and we can land on the right content
// immediately instead of leaving the reader on a hero that is still black.
document.documentElement.classList.add('js-ready');

// js-ready is also what hides the story acts, so it is only safe while the
// story is actually coming. If initStory never arms the stage, take it back off
// rather than leave nineteen viewports of hidden content behind.
const readyWatchdog = setTimeout(() => {
  if (!document.querySelector('.focus__stage.is-focus-armed')) {
    console.warn('[story] never armed, unhiding acts');
    document.documentElement.classList.remove('js-ready');
  }
}, 6000);

// Land on the saved offset in the first frame. bootRest re-asserts it exactly
// once every pin has been measured; this early pass is what stops the reader
// from watching a black hero while that happens.
const maxY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
const wantsRestore = savedY >= 8 && !location.hash;

// If the reader takes hold of the page while it is still booting, that beats
// anything we saved. The first-frame landing above has already put them in the
// right place; the corrective pass in restoreScroll must not then yank them
// back out of a scroll they started themselves.
let userScrolled = false;
const noteUserScroll = () => { userScrolled = true; };
for (const ev of ['wheel', 'touchstart', 'keydown']) {
  window.addEventListener(ev, noteUserScroll, { passive: true, once: true });
}
window.scrollTo(0, wantsRestore ? Math.min(savedY, maxY()) : 0);

// Nothing is written back to storage until the restore has actually happened.
// Boot moves the page around on its way to the saved offset, and none of those
// intermediate positions may be allowed to overwrite it.
let restored = false;
// The last position we actually observed while scrolling, rather than whatever
// window.scrollY reports at teardown — some browsers reset it on unload, which
// would save a 0 over a perfectly good offset on the way out.
let lastY = 0;
const persistY = () => {
  if (!restored) return;
  try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(lastY))); } catch { /* private mode */ }
};
let persistTimer = 0;
window.addEventListener('scroll', () => {
  lastY = window.scrollY;
  if (persistTimer) return;
  persistTimer = setTimeout(() => { persistTimer = 0; persistY(); }, 200);
}, { passive: true });
// pagehide covers reload and navigation; visibilitychange covers iOS Safari,
// which can discard a backgrounded tab without ever firing pagehide.
window.addEventListener('pagehide', persistY);
document.addEventListener('visibilitychange', () => { if (document.hidden) persistY(); });

// Dev-only view of the restore state machine. Stripped from production builds.
if (import.meta.env?.DEV) {
  window.__scroll = () => ({
    savedY, lastY, restored, userScrolled, wantsRestore,
    stored: sessionStorage.getItem(SCROLL_KEY), y: window.scrollY,
  });
}

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
// The veil is a full-screen #000 layer at z-index 6 — the only thing on the
// page that can black out the whole viewport. It rises to mask the handoff and
// must be back to 0 BY the end of the flight, so no exit path can strand it.
// It previously climbed to 1 at p=0.94 and stayed there, cleared only by
// onLeave — which never fires if you refresh past the flight, or if you
// re-enter it scrolling upward.
function veilAt(p) {
  if (p <= 0.82 || p >= 1) return 0;
  const t = (p - 0.82) / 0.18;           // 0..1 across the handoff band
  return t < 0.5 ? t / 0.5 : (1 - t) / 0.5;
}

// Where the flight stands. Before its trigger exists we still know the answer
// from the scroll position: anything past the flight spacer means it is over.
// Answering 0 there would fade the hero grid back in at full alpha on top of
// whatever section the reader actually restored onto.
function flightProgress() {
  if (flightST) return flightST.progress;
  const spacer = document.querySelector('.flight');
  const span = spacer ? spacer.offsetHeight : 0;   // matches end: 'bottom top'
  return span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : (window.scrollY > 0 ? 1 : 0);
}

function syncHero(p, active = true) {
  grid?.setFlight(p);
  const titleFade = Math.max(0, 1 - p * 3.2);
  warp?.setAlpha(titleFade);
  if (heroBlock) {
    heroBlock.style.opacity = String(titleFade);
    heroBlock.style.visibility = titleFade < 0.01 ? 'hidden' : 'visible';
  }
  grid?.setAlpha(p > 0.86 ? Math.max(0, 1 - (p - 0.86) / 0.14) : 1);
  if (veil) veil.style.opacity = String(active ? veilAt(p) : 0);
}

// The flight's terminal state, decided by scroll position rather than by a
// scrub value that may never have arrived. Past the end the hero is gone;
// above the start it is whole.
function settleHero(self) {
  if (self.isActive) return;
  syncHero(self.scroll() >= self.end ? 1 : 0, false);
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
    clearTimeout(heroWatchdog);
    body.classList.add('hero-css-on');

    // Only fade the hero up if the hero is what the reader is looking at. On a
    // restored deep load the flight is already spent, and running the fade
    // would paint the grid, at full alpha, straight through every section
    // below it — .doc sits at z-index 2 over a transparent canvas at 1.
    if (flightProgress() > 0.001) {
      syncHero(flightProgress());
      return;
    }

    grid.setAlpha(0);
    warp?.setAlpha(0);
    const t0 = performance.now();
    (function fadeIn(now) {
      // The flight can start under the fade — scroll wins the moment it does.
      if (flightProgress() > 0.001) { syncHero(flightProgress()); return; }
      const k = Math.min(1, (now - t0) / 600);
      grid.setAlpha(k);
      warp?.setAlpha(k);
      if (k < 1) requestAnimationFrame(fadeIn);
    })(t0);
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
  const lenis = initScroll();

  // Lenis drives the scroll position without the window reliably emitting a
  // native `scroll` event, so the listener set up at the top of this file can
  // go silent the moment Lenis takes over. Its own event is the dependable one.
  lenis?.on('scroll', ({ scroll }) => {
    lastY = scroll;
    if (persistTimer) return;
    persistTimer = setTimeout(() => { persistTimer = 0; persistY(); }, 200);
  });

  // Deliberately NOT scrolled to 0 here. The document is already at its final
  // height and already sitting on the restored offset; sending it back to the
  // top would be the black flash all over again. Lenis just adopts wherever we
  // are, and restoreScroll below re-asserts the exact offset after measuring.
  if (!wantsRestore) { lenis?.scrollTo(0, { immediate: true, force: true }); }

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
  clearTimeout(readyWatchdog);
  initWork(document.querySelector('.section--work'));

  // The flight spacer drives the hero dolly and hands off through the veil.
  const flight = document.querySelector('.flight');
  if (flight) {
    flightST = ScrollTrigger.create({
      trigger: flight,
      start: 'top top',
      // 'bottom top', NOT 'bottom bottom'. The flight spacer is 240vh of empty
      // document and .doc does not begin until its bottom edge. Ending at
      // 'bottom bottom' finished the flight a whole viewport early, at 1075px
      // of an 1843px spacer — so the grid had faded to alpha 0 while the first
      // section was still a screen below the fold. That left ~768px of the
      // scroll with nothing drawn in it at all: a black band you could land in
      // by refreshing, and which only repaired itself by scrolling back up into
      // the hero. Ending at 'bottom top' runs the fade out exactly as the lede
      // section slides up to cover the viewport.
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => syncHero(self.progress, self.isActive),
      // Re-applied after every measurement, so a refresh can never leave the
      // hero latched hidden.
      onRefresh: (self) => syncHero(self.progress, self.isActive),
      // Whenever the flight stops being the active trigger, settle the hero to
      // the end state that scroll position implies, rather than leaving it
      // wherever the scrub happened to be.
      //
      // scrub eases progress toward the scroll position over time. A large jump
      // — a restored refresh, an anchor, a hard fling on a phone — can take the
      // trigger out of range before that easing has finished, so onUpdate never
      // delivers the final 1. The grid was then stranded at full alpha, and
      // since .doc and every section under it are transparent over a canvas at
      // z-index 1, the hero photographs showed through the whole page below.
      onToggle: settleHero,
      onLeave: settleHero,
      onLeaveBack: settleHero,
    });
  }

  // Dev-only handle so the flight's real numbers can be read from the console
  // instead of inferred. Stripped from production builds by Vite.
  if (import.meta.env?.DEV) {
    window.__flight = () => flightST && {
      p: flightST.progress, start: flightST.start, end: flightST.end, active: flightST.isActive,
    };
  }

  ScrollTrigger.refresh();
  restoreScroll(lenis, ScrollTrigger);
}

// Land back where the reader was. This runs only after every pin, spacer and
// act has been measured, so the saved offset points at the same content it did
// before the reload, and every trigger applies its own state on the way.
function restoreScroll(lenis, ScrollTrigger) {
  const limit = maxY;

  // An explicit #anchor in the URL is the reader asking for somewhere else, and
  // so is a scroll they have already started.
  if (!wantsRestore || userScrolled) { restored = true; lastY = window.scrollY; return; }

  const land = (y) => {
    lenis?.scrollTo(y, { immediate: true, force: true });
    window.scrollTo(0, y);
    lastY = y;
    ScrollTrigger.update();
  };

  land(Math.min(savedY, limit()));

  // Pinning changes the document's height as it engages, so the first landing
  // can come up short. Re-measure and re-assert against the settled height.
  ScrollTrigger.refresh();
  land(Math.min(savedY, limit()));

  // Armed here, synchronously. It used to be set inside the rAF below, which
  // meant a tab that was backgrounded during load never armed at all — rAF does
  // not run while a tab is hidden — and the reader's position stopped being
  // saved from then on.
  restored = true;

  // One more pass once the page has settled, for any image that finished
  // decoding and moved the layout under us. Refinement only: whichever of the
  // frame or the timer arrives first wins, so a hidden tab still gets it.
  let settled = false;
  const settle = () => {
    if (settled || userScrolled) return;
    settled = true;
    land(Math.min(savedY, limit()));
    // Every trigger re-applies its state at the final resting position, so
    // nothing is left parked at the opacity:0 it starts from.
    ScrollTrigger.refresh();
    land(Math.min(savedY, limit()));
  };
  requestAnimationFrame(settle);
  setTimeout(settle, 250);
}

const kick = () => bootRest();
// With a position to restore, the page is wrong until bootRest has run — so
// don't wait for `load` (which waits on every image) or for a scroll the reader
// would have to supply themselves.
// setTimeout rather than rAF: a tab that is backgrounded through the load gets
// no frames, and the restore would sit there unapplied until it was looked at.
if (wantsRestore) setTimeout(kick, 0);
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
