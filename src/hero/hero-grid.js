import { getContext, program, texture, buffer, perspective, resizeCanvas } from '../lib/gl.js';
import { TILES, ATLAS } from './gallery-data.js';
import { onResize, vp } from '../lib/viewport.js';

const VS = `#version 300 es
precision highp float;

in vec2 aPos;    // quad corner, -0.5..0.5
in vec2 aCell;   // integer lattice offset from the camera cell
in float aLayer; // which depth layer this instance belongs to
in float aLift;  // per-instance jitter weight

uniform mat4 uProj;
uniform vec3 uCam;
uniform vec2 uPitch;
uniform vec2 uTile;
uniform vec2 uAtlas;
uniform float uPeriod;
uniform float uNear;
uniform float uCount;
uniform float uLayers;
uniform float uTime;

out vec2 vUv;
out float vFade;
out float vDepth;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  // Lattice follows the camera, so panning never runs out of tiles.
  vec2 base = floor(uCam.xy / uPitch);
  vec2 absCell = base + aCell;

  // Stagger each layer off the lattice so depth never lines up into corridors.
  float lj = hash(vec3(aLayer, 7.0, 3.0));
  vec2 world = absCell * uPitch + uPitch * vec2(lj, fract(lj * 3.7)) * 0.6;

  // Depth wraps modulo the layer period: the grid is infinite forward.
  float baseZ = aLayer * (uPeriod / uLayers);
  float m = mod(uCam.z - baseZ, uPeriod);
  float vz = uNear - m;

  float h = hash(vec3(absCell, aLayer));
  float scale = 0.80 + h * 0.44;

  vec3 view = vec3(world - uCam.xy, vz);
  view.y += (h - 0.5) * uPitch.y * 0.22 * aLift;
  view.x += sin(uTime * 0.12 + h * 6.28) * 6.0 * aLift;

  vec3 pos = view + vec3(aPos * uTile * scale, 0.0);
  gl_Position = uProj * vec4(pos, 1.0);

  // Content is keyed to absolute lattice position, not instance index,
  // so the same image never follows you as you pan.
  float idx = floor(hash(vec3(absCell * 1.7, aLayer * 2.3 + 1.0)) * uCount);
  float col = mod(idx, uAtlas.x);
  float row = floor(idx / uAtlas.x);
  vUv = (vec2(col, row) + vec2(aPos.x + 0.5, 0.5 - aPos.y)) / uAtlas;

  float t = m / uPeriod;
  float inEdge = uNear / uPeriod;
  vFade = smoothstep(inEdge, inEdge + 0.07, t) * (1.0 - smoothstep(0.74, 1.0, t));
  vDepth = t;
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv;
in float vFade;
in float vDepth;
uniform sampler2D uTex;
uniform float uAlpha;
out vec4 frag;

void main() {
  vec4 c = texture(uTex, vUv);
  // Push distant tiles down toward the page black so depth reads honestly.
  c.rgb = mix(c.rgb, vec3(0.02), smoothstep(0.25, 0.95, vDepth) * 0.75);
  float a = vFade * uAlpha;
  frag = vec4(c.rgb * a, c.a * a);
}`;

const COLS = 7;
const ROWS = 5;
const LAYERS = 6;
const PERIOD = 2600;
const NEAR_SHIFT = 90;
const PITCH = [640, 400];
const TILE = [520, 292];   // 16:9, matching the film frames

async function buildAtlas() {
  const { cols, rows, cell, cellH } = ATLAS;
  const cv = document.createElement('canvas');
  cv.width = cols * cell;
  cv.height = rows * cellH;
  const ctx = cv.getContext('2d');
  // Fill first: a tile that fails to load degrades to a neutral card, not a hole.
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, cv.width, cv.height);

  await Promise.all(
    TILES.map(
      (src, i) =>
        new Promise((res) => {
          const img = new Image();
          img.decoding = 'async';
          img.fetchPriority = i < 6 ? 'high' : 'low';
          img.onload = () => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            ctx.drawImage(img, c * cell, r * cellH, cell, cellH);
            res();
          };
          img.onerror = res;
          img.src = src;
        })
    )
  );
  return cv;
}

export async function initHeroGrid(canvas, opts = {}) {
  const gl = getContext(canvas);
  if (!gl) return null;

  let prog;
  try {
    prog = program(gl, VS, FS);
  } catch (e) {
    console.warn('[hero-grid]', e.message);
    return null;
  }

  const atlas = await buildAtlas();
  const tex = texture(gl, atlas);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const quad = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]);
  buffer(gl, quad);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const count = COLS * ROWS * LAYERS;
  const cellData = new Float32Array(count * 2);
  const layerData = new Float32Array(count);
  const liftData = new Float32Array(count);
  let n = 0;
  for (let l = 0; l < LAYERS; l++) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        cellData[n * 2] = x - (COLS - 1) / 2;
        cellData[n * 2 + 1] = y - (ROWS - 1) / 2;
        layerData[n] = l;
        liftData[n] = 0.4 + Math.random() * 0.9;
        n++;
      }
    }
  }

  const bind = (data, size, name) => {
    buffer(gl, data);
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(loc, 1);
  };
  bind(cellData, 2, 'aCell');
  bind(layerData, 1, 'aLayer');
  bind(liftData, 1, 'aLift');
  gl.bindVertexArray(null);

  const proj = new Float32Array(16);
  const cam = { x: 0, y: 0, z: 0 };
  const drag = { x: 0, y: 0, vx: 0, vy: 0, active: false, px: 0, py: 0 };
  const state = { alpha: 0, flight: 0, running: true };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  // ---- drag to pan -------------------------------------------------------
  const onDown = (e) => {
    drag.active = true;
    drag.px = e.clientX;
    drag.py = e.clientY;
    document.body.classList.add('is-dragging');
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.px;
    const dy = e.clientY - drag.py;
    drag.px = e.clientX;
    drag.py = e.clientY;
    drag.vx -= dx * 2.2;
    drag.vy += dy * 2.2;
  };
  const onUp = (e) => {
    drag.active = false;
    document.body.classList.remove('is-dragging');
    canvas.releasePointerCapture?.(e.pointerId);
  };
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  const offResize = onResize(() => resizeCanvas(canvas, gl, vp.dpr));

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    state.running = false;
    document.body.classList.add('no-webgl');
    opts.onLost?.();
  });

  let raf = 0;
  let t0 = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!state.running) return;
    const dt = Math.min((now - t0) / 1000, 0.05);
    t0 = now;

    // Inertial pan with decay — no plugin needed for two axes.
    drag.x += drag.vx * dt;
    drag.y += drag.vy * dt;
    drag.vx *= Math.pow(0.0025, dt);
    drag.vy *= Math.pow(0.0025, dt);

    cam.x = drag.x + Math.sin(now * 0.00007) * 40;
    cam.y = drag.y + Math.cos(now * 0.00005) * 26;
    // The .flight spacer's scroll progress drives a true dolly, not a scale.
    cam.z = state.flight * PERIOD * 2.35;

    resizeCanvas(canvas, gl, vp.dpr);
    const aspect = canvas.width / Math.max(1, canvas.height);
    perspective(proj, (58 * Math.PI) / 180, aspect, 20, PERIOD * 1.2);

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (state.alpha <= 0.001) return;

    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    const u = prog.u;
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniform3f(u.uCam, cam.x, cam.y, cam.z);
    gl.uniform2f(u.uPitch, PITCH[0], PITCH[1]);
    gl.uniform2f(u.uTile, TILE[0], TILE[1]);
    gl.uniform2f(u.uAtlas, ATLAS.cols, ATLAS.rows);
    gl.uniform1f(u.uPeriod, PERIOD);
    gl.uniform1f(u.uNear, NEAR_SHIFT);
    gl.uniform1f(u.uCount, TILES.length);
    gl.uniform1f(u.uLayers, LAYERS);
    gl.uniform1f(u.uTime, now / 1000);
    gl.uniform1f(u.uAlpha, state.alpha);
    gl.uniform1i(u.uTex, 0);

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    gl.bindVertexArray(null);
  }
  raf = requestAnimationFrame(frame);

  return {
    setFlight(p) { state.flight = p; },
    setAlpha(a) { state.alpha = a; },
    destroy() {
      cancelAnimationFrame(raf);
      offResize();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    },
  };
}
