import { gsap } from 'gsap';

// Squash-and-stretch on hover and press.
export function initElasticPulse(scope = document) {
  scope.querySelectorAll('[data-elastic-pulse-btn]').forEach((btn) => {
    if (btn.dataset.pulseReady) return;
    btn.dataset.pulseReady = '1';
    const to = (vars) => { gsap.killTweensOf(btn); gsap.to(btn, vars); };
    btn.addEventListener('pointerenter', () =>
      to({ scaleX: 1.06, scaleY: 0.94, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    );
    btn.addEventListener('pointerleave', () =>
      to({ scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' })
    );
    btn.addEventListener('pointerdown', () =>
      to({ scaleX: 0.94, scaleY: 1.05, duration: 0.18, ease: 'power2.out' })
    );
    btn.addEventListener('pointerup', () =>
      to({ scaleX: 1, scaleY: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' })
    );
  });
}
