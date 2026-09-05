#!/usr/bin/env python3
import pathlib
cats = pathlib.Path('scripts/_other.html').read_text(encoding='utf-8')
LOGO = '''<svg viewBox="0 0 145 32" width="145" height="32" role="img" aria-label="Afeef Momin" focusable="false">
      <defs>
        <radialGradient id="ink" data-ink-gradient gradientUnits="userSpaceOnUse" cx="72" cy="16" r="0.001">
          <stop offset="0" stop-color="#fff" stop-opacity="1" data-ink-stop-in></stop>
          <stop offset="1" stop-color="#fff" stop-opacity="0" data-ink-stop-out></stop>
        </radialGradient>
        <mask id="inkMask"><rect x="-20" y="-20" width="185" height="72" fill="url(#ink)"></rect></mask>
        <text id="mark" x="0" y="24" font-family="Anton, sans-serif" font-size="24" letter-spacing="0.5">AFEEF MOMIN</text>
      </defs>
      <use href="#mark" fill="#ffffff" opacity="0.34"></use>
      <use href="#mark" fill="#ffffff" mask="url(#inkMask)" class="ink-masked"></use>
    </svg>'''
EMAIL = 'afeef@example.com'
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Other Work — Afeef Momin</title>
<meta name="description" content="Short films, documentaries, wedding films and cinematic reels by Afeef Momin.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter+Tight:wght@400;600&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
</head>
<body class="is-loading">
<header class="hero">
  <a class="hero__logo" href="/" aria-label="Afeef Momin — home">
    {LOGO}
  </a>
  <div class="hero__meta">
    <a class="hero__mail" href="mailto:{EMAIL}" data-elastic-pulse-btn aria-label="Email Afeef Momin">
      <svg class="copy-email-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1.5" y="3.5" width="13" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/>
        <path d="M2 5l6 4 6-4" fill="none" stroke="currentColor" stroke-width="1.3"/>
      </svg>
      <span>Get in touch</span>
    </a>
  </div>
</header>

<main class="doc">
  <article class="section case">
    <div class="case__inner">
      <h1 class="case__title">Other work</h1>
      <p class="case__lede" data-highlight-text>
        Short films, weddings and cinematic reels — the work that taught me
        performance, pressure and range.
      </p>
    </div>

{cats}

    <div class="case__inner">
      <a class="case__back" href="/" data-elastic-pulse-btn>&larr; Back to healthcare films</a>
    </div>
  </article>
</main>

<div class="tile-view" hidden></div>
<script type="module" src="/src/case.js"></script>
</body>
</html>
'''
pathlib.Path('other-work/index.html').write_text(page, encoding='utf-8')
print('other-work/index.html written,', len(page), 'bytes')
