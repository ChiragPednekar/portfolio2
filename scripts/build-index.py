#!/usr/bin/env python3
"""Generates index.html from the film manifest so titles with quotes, emoji and
Devanagari/Marathi text are escaped correctly rather than by hand."""
import html, json, pathlib, re

META = pathlib.Path('/private/tmp/claude-501/-Users-chiragyogeshpednekar-Documents-portfolio/f6618b04-6abf-4406-9a8b-14ad7aceade9/scratchpad/yt/meta.tsv')
titles = {}
for line in META.read_text(encoding='utf-8').splitlines():
    if not line.strip():
        continue
    vid, t = line.split('\t', 1)
    titles[vid] = t.strip()

PROJECTS = [
    {
        "slug": "shree-ivf",
        "client": "Shree IVF Clinic",
        "lead": "Dr Jay Mehta — Mumbai",
        "badge": "Ongoing",
        "year": "2024 — 2026",
        "blurb": "Surgical documentation and clinic diaries: endometriosis procedures, IVF explainers and day-in-the-life films made to leave a patient informed rather than frightened.",
        "films": ["8d-CA5TRqF4", "7Ki1kSz_MCk", "PM3R1xvctYc", "xuKrSJ-3S9Q",
                   "aL_4tY69gwY", "lXeZt_tJ7hc", "IQtUCMDevTw", "aJd2aqDYRl0", "5eHH3-QlFR8"],
    },
    {
        "slug": "supriya-puranik",
        "client": "Dr Supriya Puranik",
        "lead": "IVF & Gynaecology — Pune",
        "badge": "",
        "year": "2025",
        "blurb": "Patient stories and episodic clinic documentary, including a treatment journey that begins in Cameroon and ends in an Indian operating theatre.",
        "films": ["H1M4ojBF2kg", "JhNTwm6BHn0", "C4rBvJArcpU"],
    },
    {
        "slug": "dr-dc-plastics",
        "client": "Dr DC Plastic Surgery",
        "lead": "Pune",
        "badge": "",
        "year": "2025",
        "blurb": "Long-form patient documentary paired with unfiltered operating-theatre film — the procedure shown plainly, the person kept at the centre of it.",
        "films": ["mpa6oH7iQqI", "a84lWqSFhMc"],
    },
    {
        "slug": "lokmanya",
        "client": "Lokmanya Hospitals",
        "lead": "Dr Narendra Vaidya — Orthopaedics",
        "badge": "",
        "year": "2024",
        "blurb": "A craft film on knee replacement surgery, built around the surgeon's hands and the decisions behind them.",
        "films": ["cUBEhm7Nq70"],
    },
]

def esc(s):
    return html.escape(s, quote=True)

def film_slide(vid):
    t = titles.get(vid, 'Film')
    return f'''          <div class="work__slide">
            <button class="work__shot-btn" type="button" data-video-id="{vid}" data-video-title="{esc(t)}"
                    aria-label="Play film: {esc(t)}">
              <img class="work__shot" src="/films/{vid}.jpg" alt="{esc(t)}" loading="lazy" decoding="async" width="1280" height="720">
              <span class="work__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>
              </span>
              <span class="work__caption">{esc(t)}</span>
            </button>
          </div>'''

def dots(n, label):
    out = [f'          <button class="work__dot{" is-active" if i == 0 else ""}" type="button" aria-label="Film {i+1} of {n}"></button>' for i in range(n)]
    return f'''        <div class="work__dots" role="tablist" aria-label="{esc(label)} films">
{chr(10).join(out)}
        </div>'''

def project(p):
    badge = f'<span class="work__badge">{esc(p["badge"])}</span>' if p["badge"] else ''
    slides = "\n".join(film_slide(v) for v in p["films"])
    n = len(p["films"])
    count = f'{n} film' + ('s' if n != 1 else '')
    return f'''    <article class="work__item">
      <div class="work__head" data-fold>
        <div class="work__meta">{badge}<span class="work__year">{esc(p["year"])}</span><span class="work__count">{count}</span></div>
        <h3 class="work__name"><span class="work__name-link is-bend" data-bend>{esc(p["client"])}</span></h3>
        <p class="work__lead">{esc(p["lead"])}</p>
        <p class="work__blurb">{esc(p["blurb"])}</p>
      </div>
      <div class="work__slider" data-slider-status>
        <div class="work__viewport"><div class="work__track" data-grab>
{slides}
        </div></div>
{dots(n, p["client"])}
      </div>
    </article>'''

work_html = "\n\n".join(project(p) for p in PROJECTS)
total = sum(len(p["films"]) for p in PROJECTS)

pathlib.Path('scripts/_work.html').write_text(work_html, encoding='utf-8')
print(f"generated {len(PROJECTS)} projects, {total} films")

# Hero tile manifest, newest-looking work first.
order = [v for p in PROJECTS for v in p["films"]]
tiles = ",\n  ".join(f"'/films/{v}.jpg'" for v in order)
pathlib.Path('src/hero/gallery-data.js').write_text(
f"""// Hero grid atlas manifest — real film frames, served same-origin so the
// canvas atlas is not tainted for WebGL upload.
export const TILES = [
  {tiles},
];

// 16:9 cells to match the source frames.
export const ATLAS = {{ cols: 4, rows: 4, cell: 512, cellH: 288 }};
""", encoding='utf-8')
print("wrote gallery-data.js with", len(order), "tiles")
