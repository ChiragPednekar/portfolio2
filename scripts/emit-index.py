#!/usr/bin/env python3
import pathlib
work = pathlib.Path('scripts/_work.html').read_text(encoding='utf-8')

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

HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Afeef Momin — Filmmaker &amp; Creative Head</title>
<meta name="description" content="Afeef Momin directs healthcare and brand films. Creative head and video production manager at a healthcare marketing agency.">
<meta property="og:title" content="Afeef Momin — Filmmaker &amp; Creative Head">
<meta property="og:description" content="Healthcare and brand films. Every story has a heartbeat — my job is to find it.">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter+Tight:wght@400;600&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
</head>
<body class="is-loading" data-story="listening-first">

<canvas class="stage-gl" aria-hidden="true"></canvas>
<div class="infinite-grid" aria-hidden="true"></div>
<div class="nav-veil" aria-hidden="true"></div>
'''

# NOTE: contact details are placeholders — see README "Before this goes live".
EMAIL = 'afeef@example.com'
WHATSAPP = 'https://wa.me/000000000000'

body = f'''{HEAD}
<header class="hero" data-bouncy-tabs-init>
  <a class="hero__logo" href="#top" aria-label="Afeef Momin — home">
    {LOGO}
  </a>

  <nav class="hero__nav" data-bouncy-tabs-nav aria-label="Sections">
    <span class="hero__nav-ghost" data-bouncy-tabs-ghost aria-hidden="true"></span>
    <span class="hero__nav-pill" data-bouncy-tabs-indicator aria-hidden="true"></span>
    <a href="#intro" data-bouncy-tabs-button data-active aria-controls="intro">Intro</a>
    <a href="#approach" data-bouncy-tabs-button aria-controls="approach">Approach</a>
    <a href="#work" data-bouncy-tabs-button aria-controls="work">Films</a>
    <a href="#about" data-bouncy-tabs-button aria-controls="about">About</a>
  </nav>

  <div class="hero__meta">
    <!-- TODO: location intentionally omitted — not confirmed for public display. -->
    <a class="hero__mail" href="mailto:{EMAIL}" data-elastic-pulse-btn
       aria-label="Email Afeef Momin">
      <svg class="copy-email-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1.5" y="3.5" width="13" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/>
        <path d="M2 5l6 4 6-4" fill="none" stroke="currentColor" stroke-width="1.3"/>
      </svg>
      <span>Get in touch</span>
    </a>
  </div>
</header>

<div class="hero__title" data-hero id="top">
  <p class="hero__eyebrow">Afeef Momin — Filmmaker &amp; Creative Head</p>
  <h1 class="headline-text">Every story has
a heartbeat</h1>
  <p class="hero__range">Drag the frames · scroll to fly through</p>
</div>

<p class="fallback">
  <span class="fallback__line">Your browser could not start WebGL.</span>
  <span class="fallback__line">The site still works — the depth effects are simply switched off.</span>
</p>

<div class="flight" aria-hidden="true"></div>

<main class="doc">

  <section id="intro" class="section section--lede">
    <p class="eyebrow">Intro</p>
    <h2 data-highlight-text data-highlight-scroll-end data-fold>
      I direct healthcare and brand films. By day I am creative head and video
      production manager at a healthcare marketing agency, which is a long way of
      saying I make complicated medical things feel simple and human.
    </h2>
  </section>

  <section id="approach" class="section section--focus" aria-label="Approach">
    <div class="focus__stage">

      <svg class="focus__defs" aria-hidden="true" focusable="false">
        <filter id="focus-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/>
          <feColorMatrix in="b" mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo"/>
          <feBlend in="SourceGraphic" in2="goo"/>
        </filter>
      </svg>

      <div class="story__act" data-act="listening">
        <div class="listening__bg" aria-hidden="true"></div>
        <canvas class="listening__canvas" aria-hidden="true"></canvas>
        <h2 class="listening__title story__act-title">Listening</h2>
        <p class="story__note story__note--listening">
          A surgeon, a patient and a marketing team rarely want the same film.
          The first job is to sit with all three long enough to hear what the
          story actually is.
        </p>
      </div>

      <div class="story__act" data-act="focus">
        <div class="focus__unicorn" aria-hidden="true"></div>
        <div class="focus__burst" aria-hidden="true">
          <div class="focus__wash"></div>
          <div class="focus__glow"></div>
          <div class="focus__rays"></div>
          <div class="focus__ring focus__ring--1"></div>
          <div class="focus__ring focus__ring--2"></div>
          <div class="focus__ring focus__ring--3"></div>
          <div class="focus__flash"></div>
          <div class="focus__charge"></div>
        </div>
        <div class="focus__dots" aria-hidden="true">
          <span class="focus__dot focus__dot--l"></span>
          <span class="focus__dot focus__dot--r"></span>
        </div>
        <div class="focus__sparks" aria-hidden="true">
          <span class="focus__spark"></span><span class="focus__spark"></span>
          <span class="focus__spark"></span><span class="focus__spark"></span>
          <span class="focus__spark"></span><span class="focus__spark"></span>
          <span class="focus__spark"></span><span class="focus__spark"></span>
        </div>
        <div class="focus__motes" aria-hidden="true">
          <span class="focus__mote"></span><span class="focus__mote"></span>
          <span class="focus__mote"></span><span class="focus__mote"></span>
          <span class="focus__mote"></span><span class="focus__mote"></span>
          <span class="focus__mote"></span><span class="focus__mote"></span>
        </div>
        <h2 class="focus__title story__act-title">Focus</h2>
        <p class="story__note story__note--focus">
          Figuring out what a piece of footage is for, and then being ruthless
          about everything that isn't that.
        </p>
      </div>

      <div class="story__act" data-act="craft">
        <div class="craft__scene" aria-hidden="true"></div>
        <h2 class="craft__title story__act-title">Craft</h2>
        <p class="story__note story__note--craft">
          Operating theatres do not do second takes. Neither do weddings. The
          craft is being ready enough that the one take you get is the one you
          needed.
        </p>
      </div>

      <div class="story__act" data-act="validation">
        <div class="validation__scene" aria-hidden="true"></div>
        <h2 class="validation__title story__act-title">Validation</h2>
        <p class="story__note story__note--validation">
          The hardest brief in the world is "explain this treatment in thirty
          seconds without scaring anyone." You only know if it worked by watching
          someone watch it.
        </p>
      </div>

    </div>
  </section>

  <section class="section section--featured" aria-label="Featured">
    <div class="featured__stage">
      <h2 class="featured__title">Healthcare films</h2>
    </div>
  </section>

  <section id="work" class="section section--work work" aria-label="Healthcare and brand films">

{work}

    <div class="other" data-fold>
      <h2 class="other__title">Other work</h2>
      <p class="other__blurb">
        Short films, weddings and cinematic reels — the work that taught me
        performance, pressure and range.
      </p>
      <ul class="other__list">
        <li class="other__item"><span class="other__kind">Short films &amp; documentaries</span><span class="other__note">Directing performance and structure, not a brief. <b>12 films</b></span></li>
        <li class="other__item"><span class="other__kind">Wedding films</span><span class="other__note">Live, unrepeatable, high-pressure. Nothing goes wrong on a corporate set that hasn't already gone wrong at a wedding. <b>9 films</b></span></li>
        <li class="other__item"><span class="other__kind">Cinematic reels</span><span class="other__note">Range and visual energy — the city, shot for the feed. <b>7 films</b></span></li>
      </ul>
      <a class="work__link" href="/other-work/" data-elastic-pulse-btn>See all 28 &rarr;</a>
    </div>

  </section>

  <section id="about" class="section about" aria-label="About">
    <div class="about__photo" aria-hidden="true"></div>
    <div class="about__inner">
      <h2 class="about__title" data-highlight-text data-highlight-color="#f2efe8">
        Making complicated medical things feel simple and human
      </h2>

      <ul class="about__stats">
        <li><strong>3 yrs</strong><span>Creative head, healthcare marketing</span></li>
        <li><strong>150</strong><span>Campaigns built for healthcare clients</span></li>
        <li><strong>Open</strong><span>To good projects and the right conversation</span></li>
      </ul>

      <div class="about__copy">
        <p>I'm Afeef Momin and I direct films for a living.</p>
        <p>By day I'm creative head and video production manager at a healthcare
          marketing agency, which is a long way of saying I spend a lot of time
          making complicated medical things feel simple and human. Three years in,
          I've built 150 campaigns for healthcare clients and I've learned that the
          hardest brief in the world is "explain this treatment in thirty seconds
          without scaring anyone."</p>
        <p>The rest of my work is less clinical. I've shot weddings where nothing
          can be reshot and everything is happening at once. Short films where I
          got to actually direct performance instead of a brief. Music videos where
          the only rule was that it had to look good loud.</p>
        <p>People sometimes ask why I don't specialise. I think I have — just not in
          a genre. What I'm good at is figuring out what a piece of footage is for,
          and then being ruthless about everything that isn't that.</p>
        <p>I'm currently in a full-time role and happy in it, but I'm always open to
          good projects and the right conversation.</p>
      </div>
      <p class="about__sign">Afeef</p>
    </div>
  </section>

  <footer id="contact" class="section outro" aria-label="Contact">
    <div class="outro__fx" aria-hidden="true"></div>
    <div class="outro__inner">
      <h2 class="outro__title">Let's talk about the film you're trying to make</h2>
      <div class="outro__cta">
        <a class="outro__primary" href="mailto:{EMAIL}?subject=Project%20enquiry" data-elastic-pulse-btn>
          Start a conversation
        </a>
        <a class="outro__secondary" href="{WHATSAPP}" target="_blank" rel="noopener noreferrer" data-elastic-pulse-btn>
          WhatsApp
        </a>
      </div>
    </div>

    <div class="outro__roll" aria-hidden="true">
      <div class="outro__roll-inner"><span class="outro__roll-ch">Healthcare films · Brand films · Open for projects —&nbsp;</span></div>
    </div>

    <div class="outro__meta">
      <div class="outro__social">
        <button class="outro__mail" type="button" data-copy data-copy-email="{EMAIL}" data-elastic-pulse-btn>
          <svg class="copy-email-icon copy-email-icon--lg" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <rect x="1.5" y="3.5" width="13" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 5l6 4 6-4" fill="none" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          <span>Copy email</span>
        </button>
        <!-- TODO: add the real CV file to public/ and point this at it. -->
        <a class="outro__cv" href="/afeef-momin-cv.pdf" download>Download CV</a>
        <span class="outro__copied" role="status" aria-live="polite"></span>
      </div>
      <span>&copy; 2026 Afeef Momin</span>
    </div>
  </footer>

</main>

<div class="tile-view" hidden></div>

<script type="module" src="/src/main.js"></script>
</body>
</html>
'''
pathlib.Path('index.html').write_text(body, encoding='utf-8')
print('index.html written,', len(body), 'bytes')
