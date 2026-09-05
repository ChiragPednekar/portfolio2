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
    <figure class="tile-view__frame">
      <div class="tile-view__player"></div>
      <figcaption class="tile-view__cap"></figcaption>
    </figure>
    <button class="tile-view__close" type="button" data-close aria-label="Close">&times;</button>`;

  const player = portal.querySelector('.tile-view__player');
  const cap = portal.querySelector('.tile-view__cap');
  const frame = portal.querySelector('.tile-view__frame');
  const closeBtn = portal.querySelector('.tile-view__close');
  let opener = null;

  // Nothing is embedded until a play is requested, so no YouTube script or
  // cookie is loaded on page view.
  function openVideo(id, title) {
    opener = document.activeElement;
    player.innerHTML =
      `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1"` +
      ` title="${(title || 'Film').replace(/"/g, '&quot;')}" frameborder="0" allow="accelerometer; autoplay;` +
      ` clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    cap.textContent = title || '';
    portal.hidden = false;
    window.dispatchEvent(new CustomEvent('lightbox:toggle', { detail: { open: true } }));
    gsap.fromTo(portal, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' });
    gsap.fromTo(frame, { scale: 0.92, y: 24 }, { scale: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    closeBtn.focus();
  }

  function close() {
    window.dispatchEvent(new CustomEvent('lightbox:toggle', { detail: { open: false } }));
    // Tear the iframe down immediately so audio stops the moment it is asked to,
    // not when the fade tween happens to finish.
    player.innerHTML = '';
    gsap.to(portal, {
      opacity: 0, duration: 0.22, ease: 'power2.in',
      onComplete: () => { portal.hidden = true; cap.textContent = ''; opener?.focus?.(); },
    });
  }

  portal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) close(); });
  document.addEventListener('keydown', (e) => {
    if (portal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-video-id]');
    if (!btn) return;
    e.preventDefault();
    openVideo(btn.dataset.videoId, btn.dataset.videoTitle);
  });
}
