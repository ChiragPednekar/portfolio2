# Afeef Momin — Portfolio

Filmmaker and creative head. Healthcare and brand films lead; short films, weddings
and music videos sit under Other Work.

A vanilla-JS, Vite-bundled site rebuilding the architecture and motion system
described in the audit brief. No framework, no three.js, no external ambient-WebGL
service.

## Before this goes live

Five things are placeholders because they were never supplied. **Do not ship without
replacing them** — the first two are the site's whole purpose.

| What | Where | Current placeholder |
| --- | --- | --- |
| Email address | `index.html` + `other-work/index.html` (`mailto:` ×3, `data-copy-email`) | `afeef@example.com` |
| WhatsApp number | `index.html`, `.outro__secondary` | `https://wa.me/000000000000` |
| CV file | `.outro__cv` → `public/afeef-momin-cv.pdf` | link points at a file that does not exist |
| Portrait photo | `public/about/portrait.svg` | abstract placeholder, not a photo |
| Location | header `.hero__meta` | omitted entirely — never confirmed for public display |

```bash
# after adding the real address:
grep -rl 'afeef@example.com' index.html other-work/index.html | xargs sed -i '' 's/afeef@example.com/REAL@ADDRESS/g'
```

## Content model

15 healthcare films, grouped by client into 4 projects:

| Client | Films |
| --- | --- |
| Shree IVF Clinic — Dr Jay Mehta, Mumbai | 9 |
| Dr Supriya Puranik — Pune | 3 |
| Dr DC Plastic Surgery — Pune | 2 |
| Lokmanya Hospitals — Dr Narendra Vaidya | 1 |

Film titles were pulled from YouTube's public oEmbed endpoint, not typed by hand.
Thumbnails are downloaded to `public/films/<id>.jpg` and served same-origin — a
cross-origin image would taint the canvas atlas and break the WebGL upload. The
same frames feed the hero grid via `src/hero/gallery-data.js`.

Films play in the existing lightbox as a `youtube-nocookie` iframe, built only on
click, so no YouTube script or cookie loads on page view. The iframe is torn down
on close so audio stops immediately rather than when the fade tween finishes.

To change the grouping or add films, edit `PROJECTS` in `scripts/build-index.py`
and re-run:

```bash
python3 scripts/build-index.py && python3 scripts/emit-index.py
```

Project blurbs are drafts written from the film titles — worth Afeef's review.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite, multi-page (`/`, `/other-work/`) |
| Language | Vanilla ES modules, dynamic `import()` past the hero |
| Smooth scroll | Lenis (`html.lenis`) |
| Animation | GSAP 3 + ScrollTrigger + SplitText + Draggable + InertiaPlugin |
| Hero grid | Raw WebGL2, instanced quads, canvas-2D atlas |
| Hero title | Canvas-2D rasterised text → texture → bent mesh + chromatic fringing |
| Ambient scenes | Hand-written canvas 2D / CSS-3D |
| CSS | Hand-written, no utility framework |

Entry bundle is ~5 KB; everything past the hero is a separate chunk loaded on the
first `wheel` / `touchstart`, or on `load`, whichever comes first.

## Deviations from the brief — and why

**SplitText and InertiaPlugin are not paid.** GSAP became fully free in 2025, so
both ship in the public `gsap` npm package. No substitutes were needed and none
were written.

**Fonts.** Arges Black / Neue Montreal / Breathney are commercially licensed and
their webfont files can't be reused. Substituted with Anton, Inter Tight and
Dancing Script (all OFL, via Google Fonts). Swap `--font-display`, `--font-ui`,
`--font-script` in `src/styles/tokens.css` once licences are in hand.

**Content.** Copy, bio and film list are Afeef's own. The wordmark is a plain type
treatment, not a designed logo. `public/shots/*.svg` are leftover abstract
placeholders from the scaffold and are no longer referenced by the homepage.

**No Unicorn Studio.** The two ambient scenes it provided are hand-written instead
(`src/story/listening.js` canvas field, and the CSS conic/mask liquid ring in
`src/styles/story.css`). This removes a third-party CDN runtime.

**No `overflow: hidden` on `html, body`.** The brief specifies it, but with Lenis in
window mode it makes the page unscrollable by keyboard and completely dead if the
JS fails to boot — only Lenis's programmatic scroll survives. Left off deliberately.

**No `scrollerProxy`.** Lenis v1 scrolls the window natively, so ScrollTrigger reads
the real scroll position. A proxy pointed at `lenis.animatedScroll` desynced every
scrubbed trigger on native scroll and anchor jumps.

**The WebGL fold path for the slider is not implemented.** The slider uses the DOM
bend only, which the brief notes is visually near-identical at 1.19 spv. No dead
`canvas.work__gl` element is shipped.

## Tuning the hero warp

Five shader inputs are exposed as CSS custom properties on `.headline-text` and read
each frame via `getComputedStyle`, so they can be re-authored per breakpoint without
touching GLSL:

```css
--warp-angle: 78;    /* bend angle, degrees */
--warp-persp: 2600;  /* perspective divisor — LOWER = more foreshortening */
--warp-rise: 3;      /* vertical lift of the arc */
--warp-ease: 1.7;    /* how fast the bend falls off from centre */
--warp-vary: .09;    /* per-letter variance */
```

`--warp-persp` defaults to 2600 rather than the brief's 420. 420 is smaller than a
wide headline's own half-width, which puts the camera *inside* the text and crushes
the outer glyphs to nothing. The shader also floors the divisor at `halfWidth * 1.9`
so an unusually long headline can't crush itself regardless of the authored value.

Three geometry notes, learned the hard way, are commented in the shader:

- `pow(0.0, y)` is undefined in GLSL and returns NaN on some drivers, which NaNs
  `gl_Position` and drops the entire centre column of the mesh. The base is clamped.
- The ease must shape the *bend falloff*, not the horizontal position. Applying it
  to position collapses a wide band of texture around the centre into a few pixels.
- The bend radius comes from the **chord**, not the arc length, so the headline still
  spans its box while the ends recede.

## Layout tunables

`--story-viewports` (19.35) × `--story-scale` sets the pinned approach section's
height; `--story-scale` steps `1 → .846 → .699 → .628` across breakpoints. The
slider exposes `--spv`, `--gap`, `--bend-flat`, `--bend-angle`, `--bend-depth`,
`--bend-round`, `--bend-dir`; the section fold exposes the `--fold-*` set.

## Mobile header

The fixed header is logo + four tabs + mail button, which does not fit on a phone
at full size. It steps down in three tiers:

| Width | Behaviour |
| --- | --- |
| ≤767px | Location hidden; logo 96px; the email address collapses to its icon, label kept for screen readers |
| ≤479px | Logo 84px, tabs 11.5px |
| ≤360px | Logo 76px; the mail icon drops out entirely — the footer still carries a labelled copy-email button |

Because `.hero` is `position: fixed`, overflow here does **not** extend
`document.scrollWidth`, so a broken header shows up as content sitting off-screen
rather than as a horizontal scrollbar. Check element right-edges against
`innerWidth`, not `scrollWidth`, when changing this.

Verified clean at 390px and 320px.

## Accessibility

Decorative canvases are `aria-hidden`; the canvas-rendered headline keeps its real
DOM text for screen readers; the nav implements `aria-current`, `aria-controls` and
arrow-key movement; the lightbox is a real modal dialog with focus handling and
Escape; the copy button announces via `aria-live="polite"`.
`prefers-reduced-motion: reduce` skips the warp canvas, unpins the story, and falls
back to the `fallback-earn` keyframe. `body.no-webgl` (also set on
`webglcontextlost`) swaps to the DOM grid fallback.
