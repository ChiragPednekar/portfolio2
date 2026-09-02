import { gsap } from 'gsap';

// Act 2 — two dots converge, merge through an SVG goo filter, and detonate.
// Core is CSS/SVG; the chroma pass is optional WebGL behind a try/catch.
export function makeFocus(root) {
  const q = (s) => root.querySelector(s);
  const dotL = q('.focus__dot--l');
  const dotR = q('.focus__dot--r');
  const flash = q('.focus__flash');
  const wash = q('.focus__wash');
  const glow = q('.focus__glow');
  const rays = q('.focus__rays');
  const charge = q('.focus__charge');
  const rings = [q('.focus__ring--1'), q('.focus__ring--2'), q('.focus__ring--3')].filter(Boolean);
  const sparks = [...root.querySelectorAll('.focus__spark')];
  const motes = [...root.querySelectorAll('.focus__mote')];
  const goo = root.querySelector('#focus-goo feGaussianBlur');
  const liquid = q('.focus__unicorn');

  let progress = 0;
  let active = false;
  let raf = 0;

  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  sparks.forEach((s, i) => {
    const a = (i / sparks.length) * Math.PI * 2;
    s.style.setProperty('--sx', Math.cos(a).toFixed(3));
    s.style.setProperty('--sy', Math.sin(a).toFixed(3));
  });
  motes.forEach((m, i) => {
    const a = (i / motes.length) * Math.PI * 2 + 0.4;
    m.style.setProperty('--mx', Math.cos(a).toFixed(3));
    m.style.setProperty('--my', Math.sin(a).toFixed(3));
  });

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!active) return;
    const p = progress;

    // approach 0 -> .40, merge .40 -> .52, burst .52 -> .70, liquid .70 -> 1
    const approach = clamp01(p / 0.40);
    const merge = clamp01((p - 0.40) / 0.12);
    const burst = clamp01((p - 0.52) / 0.18);
    const after = clamp01((p - 0.70) / 0.30);

    const eased = gsap.parseEase('power2.inOut')(approach);
    const gap = (1 - eased) * 40 + (1 - merge) * 2;

    gsap.set(dotL, { xPercent: -gap * 10, scale: 1 + merge * 0.5 - burst * 0.5 });
    gsap.set(dotR, { xPercent: gap * 10, scale: 1 + merge * 0.5 - burst * 0.5 });

    // Animated stdDeviation is what makes the two dots read as one liquid mass.
    if (goo) goo.setAttribute('stdDeviation', (2 + merge * 14 - burst * 14).toFixed(2));

    if (charge) gsap.set(charge, { opacity: merge * (1 - burst), scale: 0.4 + merge * 0.8 });

    const flashE = gsap.parseEase('power3.out')(burst);
    if (flash) gsap.set(flash, { opacity: burst < 1 ? flashE * (1 - burst) * 1.6 : 0, scale: 0.5 + flashE * 3 });
    if (glow) gsap.set(glow, { opacity: 0.15 + burst * 0.7 - after * 0.5, scale: 0.6 + burst * 1.4 });

    rings.forEach((r, i) => {
      const d = clamp01((burst - i * 0.12) / 0.7);
      const e = gsap.parseEase('power3.out')(d);
      gsap.set(r, { scale: 0.15 + e * (3.2 + i * 0.9), opacity: d > 0 ? (1 - d) * 0.85 : 0 });
    });

    if (rays) gsap.set(rays, { opacity: burst * (1 - burst) * 2.4, scale: 0.6 + burst * 1.8, rotate: burst * 24 });
    if (wash) gsap.set(wash, { opacity: gsap.parseEase('power1.out')(burst) * (1 - after * 0.6) * 0.85 });

    sparks.forEach((s, i) => {
      const d = clamp01((burst - (i % 4) * 0.05) / 0.8);
      const e = gsap.parseEase('power3.out')(d);
      s.style.transform = `translate(-50%,-50%) translate(${(parseFloat(s.style.getPropertyValue('--sx')) * e * 34).toFixed(2)}vmin, ${(parseFloat(s.style.getPropertyValue('--sy')) * e * 34).toFixed(2)}vmin) scale(${(1 - d * 0.6).toFixed(3)})`;
      s.style.opacity = ((1 - d) * 0.9).toFixed(3);
    });

    motes.forEach((m, i) => {
      const e = clamp01(after * 1.2 - (i % 5) * 0.06);
      m.style.transform = `translate(-50%,-50%) translate(${(parseFloat(m.style.getPropertyValue('--mx')) * (10 + e * 22)).toFixed(2)}vmin, ${(parseFloat(m.style.getPropertyValue('--my')) * (10 + e * 22)).toFixed(2)}vmin)`;
      m.style.opacity = (e * 0.6).toFixed(3);
    });

    // After the burst a liquid ring takes over, with a hard dither grain.
    if (liquid) {
      liquid.style.opacity = after.toFixed(3);
      liquid.style.setProperty('--liquid-spin', `${after * 220}deg`);
      liquid.style.setProperty('--liquid-warp', `${1 + after * 0.35}`);
    }
  }

  raf = requestAnimationFrame(frame);

  return {
    setActive: (v) => { active = v; },
    update: (p) => { progress = p; },
    destroy: () => cancelAnimationFrame(raf),
  };
}
