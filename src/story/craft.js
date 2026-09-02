// Act 3 — a CSS-3D slab receding to a vanishing point, carrying an animated
// gradient and a floating UI chip with a specular sheen.
export function makeCraft(root) {
  const scene = root.querySelector('.craft__scene');
  if (!scene) return null;

  const slab = document.createElement('div');
  slab.className = 'craft__slab';
  slab.innerHTML = `
    <div class="craft__surface"></div>
    <div class="craft__grid"></div>
    <div class="craft__chip">
      <span class="craft__chip-sheen"></span>
      <span class="craft__chip-label">Row height</span>
      <span class="craft__chip-glyph" aria-hidden="true">
        <svg viewBox="0 0 12 20" width="12" height="20"><path d="M6 1v18M6 1 2.5 5M6 1l3.5 4M6 19l-3.5-4M6 19l3.5-4"
          fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </div>`;
  scene.appendChild(slab);

  let progress = 0;
  let active = false;
  let raf = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!active) return;
    const p = progress;
    const t = now / 1000;

    // rotateX and the gradient stops are both scroll-progress driven; the
    // ambient drift rides on top via keyframes.
    const rx = 78 - p * 34;
    const ry = Math.sin(t * 0.32) * 4;
    const z = -420 + p * 300;
    slab.style.transform = `translateZ(${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    slab.style.setProperty('--craft-a', `${(18 + p * 140).toFixed(1)}%`);
    slab.style.setProperty('--craft-b', `${(46 + p * 120).toFixed(1)}%`);
    slab.style.setProperty('--craft-hue', `${(p * 90).toFixed(1)}deg`);

    const chip = slab.querySelector('.craft__chip');
    if (chip) {
      const lift = 30 + Math.sin(t * 0.9) * 10 + p * 46;
      chip.style.transform = `translate(-50%, -50%) translateZ(${lift.toFixed(1)}px) rotateX(${(-rx * 0.35).toFixed(2)}deg)`;
      chip.style.setProperty('--sheen', `${((t * 40) % 260 - 30).toFixed(1)}%`);
    }
  }
  raf = requestAnimationFrame(frame);

  return {
    setActive: (v) => { active = v; },
    update: (p) => { progress = p; },
    destroy: () => { cancelAnimationFrame(raf); slab.remove(); },
  };
}
