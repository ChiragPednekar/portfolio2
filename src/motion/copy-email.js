// Clipboard button with a polite live-region announcement.
export function initCopyEmail(scope = document) {
  scope.querySelectorAll('[data-copy]').forEach((btn) => {
    if (btn.dataset.copyReady) return;
    btn.dataset.copyReady = '1';
    const value = btn.getAttribute('data-copy-email') || btn.getAttribute('data-copy');
    const live = btn.querySelector('[aria-live]') || document.querySelector('.outro__copied');
    let timer = 0;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      btn.classList.add('is-copied');
      if (live) live.textContent = 'Email address copied to clipboard';
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.classList.remove('is-copied');
        if (live) live.textContent = '';
      }, 2200);
    });
  });
}
