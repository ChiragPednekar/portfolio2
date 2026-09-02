// Generates abstract placeholder "screenshots" so the build is self-contained.
// Swap public/shots/*.svg for real case-study imagery when you have it.
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('public/shots', { recursive: true });
mkdirSync('public/about', { recursive: true });

const palettes = [
  ['#0b1020', '#1b3a6b', '#48c4ff', '#7ef0d2'],
  ['#140b1e', '#4b1d6b', '#b14bff', '#ff7ad9'],
  ['#1a0d08', '#6b3a1d', '#ff8a3d', '#ffd27a'],
  ['#04140f', '#0f5c46', '#20d39a', '#a7ffe4'],
  ['#12060f', '#701d47', '#ff4d8d', '#ffb3c9'],
  ['#0a0f14', '#233a4d', '#7aa7c7', '#e3f2ff'],
  ['#0e0a1c', '#2d2a6b', '#6c6bff', '#b9b8ff'],
  ['#160c04', '#5c3a12', '#e0a63c', '#ffe6b0'],
];

function rnd(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function shot(i, w = 1200, h = 750) {
  const p = palettes[i % palettes.length];
  const r = rnd(i * 9781 + 17);

  // A loose suggestion of dashboard chrome: sidebar, header, cards, sparklines.
  let nav = '';
  for (let k = 0; k < 7; k++) {
    nav += `<rect x="60" y="${170 + k * 44}" width="${(110 + r() * 80).toFixed(1)}" height="12" rx="6" fill="#fff" opacity="${(0.12 + r() * 0.2).toFixed(3)}"/>`;
  }

  let cards = '';
  for (let k = 0; k < 6; k++) {
    const cx = 300 + (k % 3) * 290;
    const cy = 190 + Math.floor(k / 3) * 250;
    cards += `<rect x="${cx}" y="${cy}" width="255" height="205" rx="18" fill="#ffffff" opacity="${(0.05 + r() * 0.05).toFixed(3)}"/>`;
    cards += `<rect x="${cx + 22}" y="${cy + 26}" width="${(70 + r() * 90).toFixed(1)}" height="10" rx="5" fill="${p[3]}" opacity="0.55"/>`;
    cards += `<rect x="${cx + 22}" y="${cy + 52}" width="${(120 + r() * 80).toFixed(1)}" height="26" rx="6" fill="${p[2]}" opacity="0.85"/>`;
    let poly = '';
    for (let s = 0; s <= 10; s++) {
      poly += `${cx + 22 + s * 21},${(cy + 180 - (20 + r() * 78)).toFixed(1)} `;
    }
    cards += `<polyline points="${poly.trim()}" fill="none" stroke="${p[2]}" stroke-width="3" opacity="0.75" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p[0]}"/><stop offset="0.55" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[0]}"/>
    </linearGradient>
    <radialGradient id="r${i}" cx="0.75" cy="0.18" r="0.8">
      <stop offset="0" stop-color="${p[2]}" stop-opacity="0.5"/><stop offset="1" stop-color="${p[2]}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g${i})"/>
  <rect width="${w}" height="${h}" fill="url(#r${i})"/>
  <rect x="40" y="40" width="${w - 80}" height="${h - 80}" rx="26" fill="#000" opacity="0.28"/>
  <rect x="40" y="40" width="${w - 80}" height="72" rx="26" fill="#fff" opacity="0.06"/>
  <circle cx="78" cy="76" r="8" fill="${p[2]}"/><circle cx="104" cy="76" r="8" fill="#fff" opacity="0.25"/><circle cx="130" cy="76" r="8" fill="#fff" opacity="0.18"/>
  <rect x="40" y="112" width="220" height="${h - 152}" fill="#000" opacity="0.25"/>
  ${nav}${cards}
</svg>`;
}

for (let i = 0; i < 14; i++) {
  writeFileSync(`public/shots/shot-${String(i + 1).padStart(2, '0')}.svg`, shot(i));
}

writeFileSync(
  'public/about/portrait.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="1660" height="2200" viewBox="0 0 1660 2200">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#1a1f2b"/><stop offset="0.5" stop-color="#0b0d14"/><stop offset="1" stop-color="#05060a"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.34" r="0.5">
      <stop offset="0" stop-color="#eafdff" stop-opacity="0.30"/><stop offset="1" stop-color="#eafdff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1660" height="2200" fill="url(#p)"/>
  <rect width="1660" height="2200" fill="url(#halo)"/>
  <ellipse cx="830" cy="760" rx="250" ry="300" fill="#000" opacity="0.55"/>
  <path d="M420 2200 C 430 1500 600 1150 830 1150 C 1060 1150 1230 1500 1240 2200 Z" fill="#000" opacity="0.55"/>
  <text x="830" y="2100" font-family="sans-serif" font-size="34" fill="#ffffff" opacity="0.22" text-anchor="middle">placeholder portrait</text>
</svg>`
);
console.log('assets written:', 14);
