// Shared letter primitive: one masked span per line, one span per glyph.
export function splitLetters(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.focus__letter')];
  el.dataset.split = '1';
  const lines = el.textContent.trim().split('\n').map((s) => s.trim()).filter(Boolean);
  el.textContent = '';
  const out = [];
  lines.forEach((line) => {
    const mask = document.createElement('span');
    mask.className = 'focus__mask';
    for (const ch of line) {
      const s = document.createElement('span');
      s.className = 'focus__letter';
      s.textContent = ch === ' ' ? ' ' : ch;
      mask.appendChild(s);
      out.push(s);
    }
    el.appendChild(mask);
  });
  el.setAttribute('aria-label', lines.join(' '));
  return out;
}
