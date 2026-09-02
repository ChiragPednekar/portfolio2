import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { onResize } from '../lib/viewport.js';

gsap.registerPlugin(Draggable, InertiaPlugin);

const num = (el, name, d) => {
  const v = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(v) ? v : d;
};

export function initSlider(root) {
  const viewport = root.querySelector('.work__viewport');
  const track = root.querySelector('.work__track');
  const slides = [...root.querySelectorAll('.work__slide')];
  const dots = [...root.querySelectorAll('.work__dot')];
  if (!track || slides.length === 0) return null;

  let slideW = 0;
  let gap = 16;
  let step = 0;
  let index = 0;
  let maxIndex = 0;

  function measure() {
    const spv = num(root, '--spv', 1.19);
    gap = num(root, '--gap', 16);
    const vw = viewport.clientWidth;
    // Bail on a zero-width viewport (hidden tab, display:none ancestor, or a
    // measure before first layout). Carrying on writes negative widths and
    // collapses the track.
    if (vw <= 0) return;
    slideW = (vw - gap * (spv - 1)) / spv;
    step = slideW + gap;
    maxIndex = Math.max(0, slides.length - 1);
    slides.forEach((s, i) => {
      s.style.width = `${slideW}px`;
      s.style.left = `${i * step}px`;
    });
    track.style.width = `${slides.length * step}px`;
    track.style.height = `${viewport.clientHeight}px`;
    gsap.set(track, { x: -index * step });
    bend();
  }

  // Cylindrical book-fold: flat through the centre band, curling past it.
  function bend() {
    const flat = num(root, '--bend-flat', 0.34);
    const angle = num(root, '--bend-angle', 42);
    const depth = num(root, '--bend-depth', 260);
    const round = num(root, '--bend-round', 420);
    const dir = num(root, '--bend-dir', 1);
    const x = gsap.getProperty(track, 'x');
    const centre = viewport.clientWidth / 2;

    slides.forEach((s, i) => {
      const sc = x + i * step + slideW / 2;
      const t = (sc - centre) / Math.max(centre, 1);
      const a = Math.abs(t);
      if (a <= flat) {
        s.style.transform = 'translateZ(0px) rotateY(0deg)';
        s.style.opacity = '1';
        return;
      }
      // Clamped to [0,1]: once a slide is a full viewport out the curl has to
      // stop growing. Unclamped it goes edge-on and flies thousands of px back.
      const k = Math.min(1, (a - flat) / Math.max(1 - flat, 0.001));
      // --bend-round is the virtual cylinder radius: a larger radius delays the
      // onset of the curl rather than deepening it.
      const curve = Math.pow(k, Math.max(0.25, round / 420));
      const rot = dir * -Math.sign(t) * angle * curve;
      const z = -depth * curve;
      s.style.transform = `translateZ(${z.toFixed(2)}px) rotateY(${rot.toFixed(2)}deg)`;
      s.style.opacity = `${Math.max(0.25, 1 - curve * 0.55).toFixed(3)}`;
    });
  }

  function setIndex(i, animate = true) {
    index = Math.min(maxIndex, Math.max(0, i));
    dots.forEach((d, k) => {
      d.classList.toggle('is-active', k === index);
      d.setAttribute('aria-selected', k === index ? 'true' : 'false');
    });
    root.setAttribute('data-slider-status', `${index + 1} of ${slides.length}`);
    if (animate) gsap.to(track, { x: -index * step, duration: 0.8, ease: 'power3.out', onUpdate: bend });
    else { gsap.set(track, { x: -index * step }); bend(); }
  }

  const drag = Draggable.create(track, {
    type: 'x',
    edgeResistance: 0.82,
    inertia: true,
    allowNativeTouchScrolling: true,
    bounds: () => ({ minX: -maxIndex * step, maxX: 0 }),
    snap: { x: (v) => Math.round(v / step) * step },
    onPress() { track.setAttribute('data-grab', 'down'); },
    onRelease() { track.removeAttribute('data-grab'); },
    onDrag: bend,
    onThrowUpdate: bend,
    onThrowComplete() {
      setIndex(Math.round(-gsap.getProperty(track, 'x') / step), false);
    },
  })[0];

  dots.forEach((d, i) => {
    d.addEventListener('click', () => setIndex(i));
    d.setAttribute('role', 'tab');
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setIndex(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex(index - 1); }
  });

  measure();
  setIndex(0, false);
  onResize(() => { measure(); drag?.applyBounds(); }, false);

  return { measure, bend, setIndex, destroy: () => drag?.kill() };
}
