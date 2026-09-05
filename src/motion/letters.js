// Shared letter primitive: one masked span per line, one span per word, one
// span per glyph. The word wrapper matters: every letter is an inline-block,
// so without it the browser may break a line between ANY two letters and you
// get "HOSPITA / LS".
export function splitLetters(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.focus__letter')];
  el.dataset.split = '1';
  const lines = el.textContent.trim().split('\n').map((s) => s.trim()).filter(Boolean);
  el.textContent = '';
  const out = [];
  lines.forEach((line) => {
    const mask = document.createElement('span');
    mask.className = 'focus__mask';
    for (const chunk of line.split(/(\s+)/)) {
      if (!chunk) continue;
      if (/^\s+$/.test(chunk)) {
        // A real space, so lines may still break between words.
        mask.appendChild(document.createTextNode(' '));
        continue;
      }
      const word = document.createElement('span');
      word.className = 'focus__word';
      for (const ch of chunk) {
        const s = document.createElement('span');
        s.className = 'focus__letter';
        s.textContent = ch;
        word.appendChild(s);
        out.push(s);
      }
      mask.appendChild(word);
    }
    el.appendChild(mask);
  });
  el.setAttribute('aria-label', lines.join(' '));
  return out;
}
