import { getContext, program, texture, buffer, resizeCanvas } from '../lib/gl.js';
import { onResize, onMotionPref, vp } from '../lib/viewport.js';

// The headline is not DOM text with CSS transforms. It is rasterised to a 2D
// canvas, uploaded as a texture, and bent through a mesh so the ends genuinely
// recede in perspective rather than skewing.

const VS = `#version 300 es
precision highp float;
in vec2 aPos;      // -1..1 across the text box

uniform vec2 uRes;
uniform vec2 uCentre;
uniform float uHalf;
uniform float uHeight;
uniform float uAngle;
uniform float uPersp;
uniform float uRise;
uniform float uEase;
uniform float uVary;

out vec2 vUv;
out float vBend;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  float nx = aPos.x;
  float ax = abs(nx);

  // Per-letter variance keeps the arc from reading as a mechanical sweep.
  // It has to be interpolated between bands: a raw floor() hash makes the bend
  // angle jump at every band edge, which tears the mesh and swallows glyphs.
  float band = nx * 14.0;
  float bi = floor(band);
  float bf = smoothstep(0.0, 1.0, fract(band));
  float hv = mix(hash11(bi + 3.0), hash11(bi + 4.0), bf);
  float v = 1.0 + (hv - 0.5) * uVary;

  // The angle runs LINEARLY along the strip, so letter spacing is preserved.
  // uEase shapes how much of that bend is actually felt as you move out from
  // the centre — applying it to position instead crushes the middle glyphs
  // into a few pixels. pow(0.0, y) is undefined in GLSL and NaNs the vertex,
  // so the base is clamped away from zero.
  float thMax = radians(uAngle);
  float th = thMax * nx * v;
  float bendAmt = pow(max(ax, 1e-5), uEase);

  // Radius from the CHORD, not the arc, so the headline still spans its box.
  float R = uHalf / max(sin(thMax), 0.001);

  float Xc = R * sin(th);          // fully bent
  float Xl = nx * uHalf;           // flat
  float X = mix(Xl, Xc, bendAmt);
  float Z = R * (cos(th) - 1.0) * bendAmt;   // <= 0, ends push away

  float persp = uPersp / max(uPersp - Z, 1.0);

  float Y = aPos.y * uHeight * 0.5;
  Y += uRise * (1.0 - cos(th)) * bendAmt * uHeight * 0.5;

  vec2 px = uCentre + vec2(X, Y) * persp;
  gl_Position = vec4(px / uRes * 2.0 - 1.0, 0.0, 1.0);

  vUv = vec2(nx * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  vBend = bendAmt;
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv;
in float vBend;

uniform sampler2D uTex;
uniform float uAlpha;
uniform vec3 uColor;
uniform float uXfAD;
uniform float uXfEF;
uniform float uXfO;

out vec4 frag;

void main() {
  // Fringing scales with the bend, so the flat centre stays clean.
  float k = vBend;
  float r = texture(uTex, vUv + vec2(uXfAD, 0.0) * k).a;
  float g = texture(uTex, vUv + vec2(uXfEF, 0.0) * k).a;
  float b = texture(uTex, vUv + vec2(uXfO,  0.0) * k).a;
  float a = max(max(r, g), b) * uAlpha;
  frag = vec4(uColor * vec3(r, g, b) * uAlpha, a);
}`;

const SEG_X = 120;
const SEG_Y = 10;

function readVars(el) {
  const cs = getComputedStyle(el);
  const num = (n, d) => {
    const v = parseFloat(cs.getPropertyValue(n));
    return Number.isFinite(v) ? v : d;
  };
  return {
    angle: num('--warp-angle', 78),
    persp: num('--warp-persp', 420),
    rise: num('--warp-rise', 3),
    ease: num('--warp-ease', 1.7),
    vary: num('--warp-vary', 0.09),
  };
}

function rasterise(lines, fontPx, family, weight, tracking) {
  const dpr = Math.min(vp.dpr, 2);
  const pad = Math.ceil(fontPx * 0.28);
  const meas = document.createElement('canvas').getContext('2d');
  const font = `${weight} ${fontPx}px ${family}`;
  meas.font = font;
  if ('letterSpacing' in meas) meas.letterSpacing = `${tracking}px`;

  const widths = lines.map((l) => meas.measureText(l).width);
  const w = Math.ceil(Math.max(...widths)) + pad * 2;
  const lh = fontPx * 1.05;
  const h = Math.ceil(lh * lines.length) + pad * 2;

  const cv = document.createElement('canvas');
  cv.width = Math.max(2, Math.round(w * dpr));
  cv.height = Math.max(2, Math.round(h * dpr));
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.font = font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  lines.forEach((line, i) => {
    const x = (w - widths[i]) / 2;
    const y = pad + lh * i + fontPx * 0.82;
    ctx.fillText(line, x, y);
  });
  return { canvas: cv, w, h };
}

export async function initTitleWarp(host, source) {
  const lines = source.textContent.trim().split('\n').map((s) => s.trim()).filter(Boolean);

  const canvas = document.createElement('canvas');
  canvas.className = 'title-warp';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const gl = getContext(canvas);
  if (!gl) return null;
  let prog;
  try {
    prog = program(gl, VS, FS);
  } catch (e) {
    console.warn('[title-warp]', e.message);
    canvas.remove();
    return null;
  }

  // Grid mesh — continuous curvature instead of per-glyph facets.
  const verts = [];
  const idx = [];
  for (let y = 0; y <= SEG_Y; y++) {
    for (let x = 0; x <= SEG_X; x++) {
      verts.push((x / SEG_X) * 2 - 1, 1 - (y / SEG_Y) * 2);
    }
  }
  for (let y = 0; y < SEG_Y; y++) {
    for (let x = 0; x < SEG_X; x++) {
      const a = y * (SEG_X + 1) + x;
      const b = a + 1;
      const c = a + SEG_X + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  buffer(gl, new Float32Array(verts));
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  buffer(gl, new Uint16Array(idx), gl.ELEMENT_ARRAY_BUFFER);
  gl.bindVertexArray(null);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let tex = null;
  let texW = 1;
  let texH = 1;
  const state = { alpha: 0, reduced: vp.reduced };

  await (document.fonts?.ready ?? Promise.resolve());

  function build() {
    const cs = getComputedStyle(source);
    const fontPx = parseFloat(cs.fontSize) || 64;
    const family = cs.fontFamily;
    const weight = cs.fontWeight || 400;
    const tracking = parseFloat(cs.letterSpacing) || 0;
    // The rasteriser draws raw strings, so text-transform has to be applied here
    // or the shader renders the authored casing instead of the styled casing.
    const tf = cs.textTransform;
    const shaped = lines.map((l) =>
      tf === 'uppercase' ? l.toUpperCase() : tf === 'lowercase' ? l.toLowerCase() : l
    );
    const r = rasterise(shaped, fontPx, family, weight, tracking);
    if (tex) gl.deleteTexture(tex);
    tex = texture(gl, r.canvas, { flipY: false, mips: false });
    texW = r.w;
    texH = r.h;
    resizeCanvas(canvas, gl, vp.dpr);
  }

  build();
  const offResize = onResize(build, false);

  let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (state.reduced || state.alpha <= 0.001) {
      // Clear once on the way out, then idle instead of clearing every frame.
      if (!state.cleared) { gl.clear(gl.COLOR_BUFFER_BIT); state.cleared = true; }
      return;
    }
    state.cleared = false;
    resizeCanvas(canvas, gl, vp.dpr);
    const W = canvas.width;
    const H = canvas.height;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    const cfg = readVars(source);
    const dpr = vp.dpr;
    const u = prog.u;
    gl.uniform2f(u.uRes, W, H);
    gl.uniform2f(u.uCentre, W / 2, H / 2);
    // Fit to the viewport with a margin: a long headline must shrink, not clip.
    const halfPx = (texW * dpr) / 2;
    const fit = Math.min(1, (W * 0.5 - 24 * dpr) / Math.max(halfPx, 1));
    gl.uniform1f(u.uHalf, halfPx * fit);
    gl.uniform1f(u.uHeight, texH * dpr * fit);
    gl.uniform1f(u.uAngle, cfg.angle);
    // Floor the perspective divisor against the headline's own half-width: a
    // value smaller than that puts the camera inside the text and crushes the
    // ends to nothing. Authored values above the floor pass through untouched.
    gl.uniform1f(u.uPersp, Math.max(cfg.persp * dpr, halfPx * 1.9));
    gl.uniform1f(u.uRise, cfg.rise * 0.12);
    gl.uniform1f(u.uEase, cfg.ease);
    gl.uniform1f(u.uVary, cfg.vary);
    gl.uniform1f(u.uAlpha, state.alpha);
    gl.uniform3f(u.uColor, 0.925, 0.914, 0.886); // #ece9e2
    gl.uniform1f(u.uXfAD, 0.0022);
    gl.uniform1f(u.uXfEF, 0.0);
    gl.uniform1f(u.uXfO, -0.0022);
    gl.uniform1i(u.uTex, 0);

    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
  raf = requestAnimationFrame(frame);

  function applyMode(reduced) {
    state.reduced = reduced;
    source.classList.toggle('is-warping', !reduced);
    canvas.style.display = reduced ? 'none' : '';
  }
  applyMode(vp.reduced);
  const offPref = onMotionPref(applyMode);

  return {
    setAlpha(a) { state.alpha = a; },
    destroy() { cancelAnimationFrame(raf); offResize(); offPref(); canvas.remove(); },
  };
}
