// Act 4 — ~40 sticker sprites fall and pile up at the bottom of the slab.
// Nothing external is loaded: this is a hand-written gravity + rest-contact
// solver, not Matter.js.
const KINDS = ['heart', 'smiley', 'wow', 'kind', 'star', 'plus'];

function sprite(kind, size, dpr) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(size * dpr);
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  const s = size;
  const mid = s / 2;

  const pill = (fill) => {
    x.fillStyle = fill;
    x.beginPath();
    x.roundRect(2, s * 0.28, s - 4, s * 0.44, s * 0.22);
    x.fill();
  };

  switch (kind) {
    case 'heart': {
      x.fillStyle = '#ff4d6d';
      x.beginPath();
      x.moveTo(mid, s * 0.86);
      x.bezierCurveTo(s * 0.02, s * 0.56, s * 0.14, s * 0.10, mid, s * 0.32);
      x.bezierCurveTo(s * 0.86, s * 0.10, s * 0.98, s * 0.56, mid, s * 0.86);
      x.fill();
      break;
    }
    case 'smiley': {
      x.fillStyle = '#ffd84d';
      x.beginPath(); x.arc(mid, mid, mid - 3, 0, 6.2832); x.fill();
      x.fillStyle = '#241a00';
      x.beginPath(); x.arc(mid - s * 0.15, mid - s * 0.10, s * 0.055, 0, 6.2832); x.fill();
      x.beginPath(); x.arc(mid + s * 0.15, mid - s * 0.10, s * 0.055, 0, 6.2832); x.fill();
      x.lineWidth = s * 0.06; x.strokeStyle = '#241a00'; x.lineCap = 'round';
      x.beginPath(); x.arc(mid, mid + s * 0.04, s * 0.22, 0.35, Math.PI - 0.35); x.stroke();
      break;
    }
    case 'wow': {
      pill('#4dd2ff');
      x.fillStyle = '#04222e';
      x.font = `700 ${s * 0.24}px Inter Tight, system-ui, sans-serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('WOW', mid, mid);
      break;
    }
    case 'kind': {
      pill('#b07dff');
      x.fillStyle = '#180a2e';
      x.font = `700 ${s * 0.19}px Inter Tight, system-ui, sans-serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('BE KIND', mid, mid);
      break;
    }
    case 'star': {
      x.fillStyle = '#7ef0d2';
      x.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 6.2832 - Math.PI / 2;
        const r = i % 2 ? mid * 0.36 : mid - 3;
        const px = mid + Math.cos(a) * r;
        const py = mid + Math.sin(a) * r;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.closePath(); x.fill();
      break;
    }
    default: {
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.roundRect(mid - s * 0.08, 4, s * 0.16, s - 8, s * 0.08);
      x.roundRect(4, mid - s * 0.08, s - 8, s * 0.16, s * 0.08);
      x.fill();
    }
  }
  return c;
}

export function makeValidation(root) {
  const scene = root.querySelector('.validation__scene');
  if (!scene) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'validation__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  scene.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let sprites = {};
  let bodies = [];
  let active = false;
  let progress = 0;
  let raf = 0;
  const COUNT = 40;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    sprites = {};
    const base = Math.max(34, Math.min(74, W * 0.055));
    for (const k of KINDS) sprites[k] = { c: sprite(k, base, dpr), s: base };

    bodies = Array.from({ length: COUNT }, (_, i) => {
      const kind = KINDS[i % KINDS.length];
      const s = sprites[kind].s * (0.72 + Math.random() * 0.6);
      return {
        kind,
        s,
        r: s * 0.46,
        x: W * (0.12 + Math.random() * 0.76),
        y: -s - Math.random() * H * 1.4,
        vx: 0, vy: 0,
        rot: (Math.random() - 0.5) * 1.2,
        vr: (Math.random() - 0.5) * 0.06,
        released: i / COUNT,
        resting: false,
      };
    });
  }

  function measure() {
    const r = scene.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.max(2, Math.round(W * dpr));
    canvas.height = Math.max(2, Math.round(H * dpr));
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  const FLOOR_PAD = 0.06;

  function step(dt) {
    const floor = H * (1 - FLOOR_PAD);
    for (const b of bodies) {
      // Release is tied to scroll progress, so scrubbing back un-drops them.
      if (progress < b.released * 0.72 + 0.05) {
        b.y = -b.s - 20;
        b.vy = 0; b.vx = 0; b.resting = false;
        continue;
      }
      if (b.resting) continue;
      b.vy += 2100 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr;

      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.4; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.4; }

      if (b.y + b.r > floor) {
        b.y = floor - b.r;
        b.vy *= -0.24;
        b.vx *= 0.72;
        b.vr *= 0.55;
        if (Math.abs(b.vy) < 26) { b.vy = 0; b.resting = true; b.vr = 0; }
      }
    }

    // Pairwise separation, a couple of relaxation passes. Enough for a pile.
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        if (a.y < -a.s) continue;
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          if (b.y < -b.s) continue;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const min = a.r + b.r;
          let d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const push = (min - d) / d * 0.5;
          dx *= push; dy *= push;
          a.x -= dx; a.y -= dy;
          b.x += dx; b.y += dy;
          // Contact wakes the lower body just enough to settle, then rests.
          if (Math.abs(dy) > 0.4) {
            if (a.resting && dy < 0) { a.vy = 0; }
            if (b.resting && dy > 0) { b.vy = 0; }
          }
          a.vr += (Math.random() - 0.5) * 0.004;
          b.vr += (Math.random() - 0.5) * 0.004;
          if (!a.resting) a.vx *= 0.98;
          if (!b.resting) b.vx *= 0.98;
        }
      }
    }
  }

  let last = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!active) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    step(dt);

    ctx.clearRect(0, 0, W, H);
    for (const b of bodies) {
      if (b.y < -b.s) continue;
      const sp = sprites[b.kind];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(sp.c, -b.s / 2, -b.s / 2, b.s, b.s);
      ctx.restore();
    }
  }

  measure();
  raf = requestAnimationFrame(frame);

  return {
    measure,
    setActive: (v) => { active = v; },
    update: (p) => { progress = p; },
    destroy: () => { cancelAnimationFrame(raf); canvas.remove(); },
  };
}
