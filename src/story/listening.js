// Act 1 — a drifting soft-focus bubble field with hairline constellation lines
// drawn from a moving centre. Written by hand rather than pulled from a
// third-party ambient-WebGL service, so there is no external runtime.
export function makeListening(root) {
  const bg = root.querySelector('.listening__bg');
  const canvas = root.querySelector('.listening__canvas');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d', { alpha: true });

  let W = 0, H = 0, dpr = 1;
  let bubbles = [];
  let active = false;
  let progress = 0;
  let raf = 0;

  // Each bubble's gradient and blur are baked into a sprite once. Doing this
  // per frame (ctx.filter = blur + a fresh createRadialGradient for every
  // bubble) is what made this act stutter: canvas blur is enormously
  // expensive and 60 gradients a frame churn the GC.
  function makeSprite(b) {
    const pad = b.blur * 2.5;
    const size = Math.ceil((b.r + pad) * 2);
    const c = document.createElement('canvas');
    c.width = c.height = Math.max(2, Math.round(size * dpr));
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    const m = size / 2;
    const g = x.createRadialGradient(m, m, 0, m, m, b.r);
    g.addColorStop(0, `hsla(${b.hue}, 90%, 78%, 1)`);
    g.addColorStop(0.55, `hsla(${b.hue}, 85%, 66%, 0.45)`);
    g.addColorStop(1, `hsla(${b.hue}, 80%, 60%, 0)`);
    if (b.blur > 1) x.filter = `blur(${b.blur.toFixed(1)}px)`;
    x.fillStyle = g;
    x.beginPath();
    x.arc(m, m, b.r, 0, 6.2832);
    x.fill();
    x.filter = 'none';
    b.sprite = c;
    b.spriteSize = size;
  }

  function seed() {
    const n = Math.round(Math.min(64, Math.max(26, W / 26)));
    bubbles = Array.from({ length: n }, () => {
      const r = 6 + Math.pow(Math.random(), 2.2) * 90;
      const b = {
        x: Math.random() * W,
        y: Math.random() * H,
        r,
        // Big soft ones read as bokeh, small crisp ones as spheres.
        blur: r > 46 ? 14 + Math.random() * 22 : Math.random() * 3,
        hue: 190 + Math.random() * 90,
        a: 0.10 + Math.random() * 0.30,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.05 - Math.random() * 0.16,
        ph: Math.random() * 6.28,
      };
      makeSprite(b);
      return b;
    });
  }

  function measure() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    W = r.width; H = r.height;
    canvas.width = Math.max(2, Math.round(W * dpr));
    canvas.height = Math.max(2, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (!active || W < 2) return;
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);

    // Phases: drift -> converge on a node -> rise away on strings.
    const converge = Math.min(1, Math.max(0, (progress - 0.34) / 0.28));
    const lift = Math.min(1, Math.max(0, (progress - 0.68) / 0.32));

    const cx = W * (0.5 + Math.sin(t * 0.22) * 0.14);
    const cy = H * (0.5 + Math.cos(t * 0.17) * 0.12);

    for (const b of bubbles) {
      b.x += b.vx + Math.sin(t * 0.5 + b.ph) * 0.12;
      b.y += b.vy - lift * (1.6 + b.r * 0.02);
      if (b.y + b.r < -40) { b.y = H + b.r + Math.random() * 60; b.x = Math.random() * W; }
      if (b.x < -120) b.x = W + 100;
      if (b.x > W + 120) b.x = -100;
      b._px = b.x + (cx - b.x) * converge * 0.55;
      b._py = b.y + (cy - b.y) * converge * 0.55;
    }

    // Constellation hairlines from the moving centre to nearby bubbles.
    const reach = Math.min(W, H) * (0.42 + converge * 0.4);
    ctx.lineWidth = 1;
    for (const b of bubbles) {
      const dx = b._px - cx, dy = b._py - cy;
      const d = Math.hypot(dx, dy);
      if (d > reach) continue;
      const a = (1 - d / reach) * (0.16 + converge * 0.5) * (1 - lift);
      if (a <= 0.004) continue;
      ctx.strokeStyle = `rgba(234,253,255,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      if (lift > 0) {
        // Late act: the lines become curved strings and the bubbles balloon away.
        ctx.quadraticCurveTo((cx + b._px) / 2 + 40 * lift, (cy + b._py) / 2, b._px, b._py);
      } else {
        ctx.lineTo(b._px, b._py);
      }
      ctx.stroke();
    }

    for (const b of bubbles) {
      const s = b.spriteSize;
      ctx.globalAlpha = Math.max(0, b.a * (1 - lift * 0.55));
      ctx.drawImage(b.sprite, b._px - s / 2, b._py - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    // The convergence node itself.
    if (converge > 0.02) {
      const r = 3 + converge * 16;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 5);
      g.addColorStop(0, `rgba(255,255,255,${(converge * (1 - lift)).toFixed(3)})`);
      g.addColorStop(1, 'rgba(234,253,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 5, 0, 6.2832);
      ctx.fill();
    }
  }

  measure();
  raf = requestAnimationFrame(draw);
  if (bg) bg.style.opacity = '1';

  return {
    measure,
    setActive: (v) => { active = v; },
    update: (p) => { progress = p; },
    destroy: () => cancelAnimationFrame(raf),
  };
}
