import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { splitLetters } from '../motion/letters.js';
import { onResize, vp } from '../lib/viewport.js';

import { makeListening } from './listening.js';
import { makeFocus } from './focus.js';
import { makeCraft } from './craft.js';
import { makeValidation } from './validation.js';

const ORDERS = {
  'listening-first': ['listening', 'focus', 'craft', 'validation'],
  'focus-first': ['focus', 'listening', 'craft', 'validation'],
};

export function initStory(section) {
  if (!section) return;
  const stage = section.querySelector('.focus__stage');
  if (!stage) return;

  const key = document.body.dataset.story || 'listening-first';
  const order = ORDERS[key] || ORDERS['listening-first'];

  const factories = {
    listening: makeListening,
    focus: makeFocus,
    craft: makeCraft,
    validation: makeValidation,
  };

  const acts = order.map((name) => {
    const root = stage.querySelector(`[data-act="${name}"]`);
    if (!root) return null;
    const title = root.querySelector('.focus__title, .listening__title, .craft__title, .validation__title');
    const letters = title ? splitLetters(title) : [];
    gsap.set(letters, { yPercent: 120 });
    if (title) title.classList.add('is-parked');
    const note = section.querySelector(`.story__note--${name}`);
    const scene = factories[name]?.(root) || null;
    return { name, root, title, letters, note, scene, shown: false };
  }).filter(Boolean);

  // 19.35 viewports at full scale; --story-scale steps it down per breakpoint.
  const viewports = 19.35;
  section.style.setProperty('--story-viewports', viewports);

  const reveal = (act) => {
    if (act.shown) return;
    act.shown = true;
    act.root.classList.add('is-active');
    act.title?.classList.remove('is-parked');
    act.title?.classList.add('is-revealed');
    gsap.killTweensOf(act.letters);
    gsap.to(act.letters, {
      yPercent: 0,
      duration: 0.95,
      ease: 'power3.out',
      stagger: { each: 0.026, from: 'start' },
    });
    if (act.note) gsap.to(act.note, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
  };

  const hide = (act) => {
    if (!act.shown) return;
    act.shown = false;
    act.root.classList.remove('is-active');
    act.title?.classList.remove('is-revealed');
    act.title?.classList.add('is-parked');
    gsap.killTweensOf(act.letters);
    gsap.to(act.letters, {
      yPercent: 120,
      duration: 0.55,
      ease: 'power2.inOut',
      stagger: { each: 0.012, from: 'end' },
    });
    if (act.note) gsap.to(act.note, { opacity: 0, y: 18, duration: 0.4, ease: 'power2.inOut' });
  };

  acts.forEach((a) => {
    if (a.note) gsap.set(a.note, { opacity: 0, y: 18 });
    gsap.set(a.root, { autoAlpha: 0 });
  });

  const span = 1 / acts.length;

  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${section.offsetHeight - window.innerHeight}`,
    pin: true,
    pinSpacing: false,
    anticipatePin: 1,
    // Applied on refresh as well as on scroll. Reveal used to live only in
    // onUpdate, so a load or resize that landed inside this 19-viewport
    // section left every act at autoAlpha 0 — a very tall black screen.
    onRefresh: (self) => { stage.classList.add('is-focus-armed'); apply(self.progress); },
    onUpdate: (self) => apply(self.progress),
  });

  function apply(p) {
    {
      acts.forEach((act, i) => {
        const start = i * span;
        const local = (p - start) / span;
        const live = local > -0.08 && local < 1.08;
        gsap.set(act.root, { autoAlpha: live ? 1 : 0 });
        if (!live) { if (act.shown) hide(act); act.scene?.setActive?.(false); return; }
        act.scene?.setActive?.(true);
        // Each act reads: reveal, hold, exit.
        const t = Math.min(1, Math.max(0, local));
        if (t > 0.06 && t < 0.9) reveal(act);
        else if (t >= 0.9 || t <= 0.06) hide(act);
        act.scene?.update?.(t);
      });
    }
  }

  ScrollTrigger.addEventListener('refreshInit', () => acts.forEach((a) => a.scene?.measure?.()));
  ScrollTrigger.addEventListener('refresh', () => acts.forEach((a) => a.scene?.measure?.()));
  onResize(() => acts.forEach((a) => a.scene?.measure?.()), false);

  if (vp.reduced) {
    st.kill();
    stage.style.position = 'relative';
    acts.forEach((a) => { gsap.set(a.root, { autoAlpha: 1 }); reveal(a); });
    section.style.minHeight = 'auto';
  }

  return () => { st.kill(); acts.forEach((a) => a.scene?.destroy?.()); };
}
