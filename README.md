# Motion Portfolio

A vanilla-JS, Vite-bundled portfolio rebuilding the architecture and motion system
described in the audit brief. No framework, no three.js, no external ambient-WebGL
service.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite, multi-page (`/`, `/work/aurora/`, `/work/pangeam/`, `/work/lumus/`) |
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

**Content.** All copy, case studies, imagery and the wordmark are original
placeholders. Screenshots are generated abstractions (`npm run` → `node
scripts/gen-assets.mjs`); replace `public/shots/*.svg` and `public/about/portrait.svg`.

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

## Accessibility

Decorative canvases are `aria-hidden`; the canvas-rendered headline keeps its real
DOM text for screen readers; the nav implements `aria-current`, `aria-controls` and
arrow-key movement; the lightbox is a real modal dialog with focus handling and
Escape; the copy button announces via `aria-live="polite"`.
`prefers-reduced-motion: reduce` skips the warp canvas, unpins the story, and falls
back to the `fallback-earn` keyframe. `body.no-webgl` (also set on
`webglcontextlost`) swaps to the DOM grid fallback.
