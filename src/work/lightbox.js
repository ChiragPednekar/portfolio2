import { gsap } from 'gsap';

// A real modal dialog: focus trapped, scroll frozen, Escape closes.
export function initLightbox(portal) {
  if (!portal) return;
  portal.setAttribute('role', 'dialog');
  portal.setAttribute('aria-modal', 'true');
  portal.setAttribute('aria-label', 'Enlarged project image');
  portal.hidden = true;
  portal.innerHTML = `
    <div class="tile-view__scrim" data-close></div>
    <figure class="tile-view__frame"><img alt="" class="tile-view__img"></figure>
    <button class="tile-view__close" type="button" data-close aria-label="Close image">&times;</button>`;

  const img = portal.querySelector('.tile-view__img');
  const frame = portal.querySelector('.tile-view__frame');
  const closeBtn = portal.querySelector('.tile-view__close');
  let opener = null;

  function open(src, alt) {
    opener = document.activeElement;
    img.src = src;
    img.alt = alt || '';
    portal.hidden = false;
    window.dispatchEvent(new CustomEvent('lightbox:toggle', { detail: { open: true } }));
    gsap.fromTo(portal, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' });
    gsap.fromTo(frame, { scale: 0.92, y: 24 }, { scale: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    closeBtn.focus();
  }

  function close() {
    window.dispatchEvent(new CustomEvent('lightbox:toggle', { detail: { open: false } }));
    gsap.to(portal, {
      opacity: 0, duration: 0.22, ease: 'power2.in',
      onComplete: () => { portal.hidden = true; img.src = ''; opener?.focus?.(); },
    });
  }

  portal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) close(); });
  document.addEventListener('keydown', (e) => {
    if (portal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
  });

  document.addEventListener('click', (e) => {
    const shot = e.target.closest('.work__shot');
    if (!shot) return;
    open(shot.currentSrc || shot.src, shot.alt);
  });
}
