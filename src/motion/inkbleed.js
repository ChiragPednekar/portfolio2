// The wordmark reveals itself around the cursor via an animated radial-gradient
// mask. Fine-pointer only; touch gets the plain mark.
export function initInkbleed(svg) {
  if (!svg) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    svg.classList.add('is-static');
    return;
  }
  const grad = svg.querySelector('[data-ink-gradient]');
  const stopIn = svg.querySelector('[data-ink-stop-in]');
  const stopOut = svg.querySelector('[data-ink-stop-out]');
  if (!grad) return;

  let raf = 0;
  const target = { x: 72, y: 16, r: 0.001 };
  const cur = { x: 72, y: 16, r: 0.001 };

  function tick() {
    raf = 0;
    cur.x += (target.x - cur.x) * 0.22;
    cur.y += (target.y - cur.y) * 0.22;
    cur.r += (target.r - cur.r) * 0.14;
    grad.setAttribute('cx', cur.x.toFixed(2));
    grad.setAttribute('cy', cur.y.toFixed(2));
    grad.setAttribute('r', Math.max(0.001, cur.r).toFixed(2));
    stopIn?.setAttribute('stop-opacity', '1');
    stopOut?.setAttribute('stop-opacity', '0');
    if (Math.abs(target.r - cur.r) > 0.05 || Math.abs(target.x - cur.x) > 0.05) schedule();
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };

  svg.addEventListener('pointermove', (e) => {
    const b = svg.getBoundingClientRect();
    target.x = ((e.clientX - b.left) / b.width) * 145;
    target.y = ((e.clientY - b.top) / b.height) * 32;
    target.r = 46;
    schedule();
  });
  svg.addEventListener('pointerleave', () => { target.r = 0.001; schedule(); });
  svg.addEventListener('pointerenter', () => { cur.r = 0.001; schedule(); });
}
