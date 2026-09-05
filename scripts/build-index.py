#!/usr/bin/env python3
"""Generates the work markup for both pages. Titles with quotes, emoji and
Devanagari are escaped here rather than by hand."""
import html, pathlib

# Titles live in the repo, not a scratch dir, so the build is reproducible.
titles = {}
for line in pathlib.Path('scripts/_yt1.tsv').read_text(encoding='utf-8').splitlines():
    if line.strip():
        vid, t = line.split('\t', 1); titles[vid] = t.strip()

for line in pathlib.Path('scripts/_yt2.tsv').read_text(encoding='utf-8').splitlines():
    if line.strip():
        _c, vid, t = line.split('\t', 2); titles[vid] = t.strip()

reels = {}
for line in pathlib.Path('scripts/_reels.tsv').read_text(encoding='utf-8').splitlines():
    if line.strip():
        cat, code = line.split('\t', 1); reels.setdefault(cat, []).append(code.strip())

def yt(i): return {'kind': 'yt', 'id': i, 'title': titles.get(i, 'Film')}
def ig(c, label): return {'kind': 'ig', 'id': c, 'title': label}

HEALTHCARE = [
    dict(client="Shree IVF Clinic", lead="Dr Jay Mehta — Mumbai", badge="Ongoing", year="2024 — 2026",
         blurb="Surgical documentation and clinic diaries: endometriosis procedures, IVF explainers and day-in-the-life films made to leave a patient informed rather than frightened.",
         items=[yt(v) for v in ["8d-CA5TRqF4","7Ki1kSz_MCk","PM3R1xvctYc","xuKrSJ-3S9Q","aL_4tY69gwY","lXeZt_tJ7hc","IQtUCMDevTw","aJd2aqDYRl0","5eHH3-QlFR8"]]),
    dict(client="Dr Supriya Puranik", lead="IVF & Gynaecology — Pune", badge="", year="2025",
         blurb="Patient stories and episodic clinic documentary, including a treatment journey that begins in Cameroon and ends in an Indian operating theatre.",
         items=[yt(v) for v in ["H1M4ojBF2kg","JhNTwm6BHn0","C4rBvJArcpU"]]),
    dict(client="Dr DC Plastic Surgery", lead="Pune", badge="", year="2025",
         blurb="Long-form patient documentary paired with unfiltered operating-theatre film — the procedure shown plainly, the person kept at the centre of it.",
         items=[yt(v) for v in ["mpa6oH7iQqI","a84lWqSFhMc"]]),
    dict(client="Lokmanya Hospitals", lead="Dr Narendra Vaidya — Orthopaedics", badge="", year="2024",
         blurb="A craft film on knee replacement surgery, built around the surgeon's hands and the decisions behind them.",
         items=[yt(v) for v in ["cUBEhm7Nq70"]]),
    dict(client="Medical shoot reels", lead="Short-form for clinics and practitioners", badge="New", year="2025 — 2026",
         blurb="Vertical cuts built for the feed: the same clinical material paced for a viewer who is scrolling, not sitting down.",
         items=[ig(c, f"Medical shoot reel {i}") for i, c in enumerate(reels.get('medical', []), 1)]),
    dict(client="Food series", lead="Brand films for local kitchens", badge="", year="2024 — 2025",
         blurb="A running series on Bhiwandi's food: malpua, seekh, kichda and the people who have been making them the same way for decades.",
         items=[ig(c, f"Food series film {i}") for i, c in enumerate(reels.get('food', []), 1)]),
]

OTHER = [
    dict(slug="short-films", title="Short films & documentaries",
         note="Directing performance and structure, not a brief.",
         items=[yt(v) for v in ["xhG71wBK8Qo","8QKK4G_ASfI","VeYOS8qZuAA","7kpc2HpTVbI","UGYJTPZCH3M","bK75J0QFHnY","H-8VF6ECDDs","tjIjHHbdx8o","rQWxWQcS_ds","DUYXV5cuGAI","wiiVOOA084Y"]]
               + [ig(c, "Short film reel") for c in reels.get('short', [])]),
    dict(slug="weddings", title="Wedding films",
         note="Live, unrepeatable, high-pressure. Nothing goes wrong on a corporate set that hasn't already gone wrong at a wedding.",
         items=[yt(v) for v in ["YKKdfyxgOeA","sMmP-u68hMs","IFu6vW1fqGE","Nc-HdY-5yoQ","QuA871byBsE","tXuGf37Tno4","vf55c7dSZ3U","a-CeaWh0YOw","7iHAMkUdIww"]]),
    dict(slug="cinematic", title="Cinematic reels",
         note="Range and visual energy — the city, shot for the feed.",
         items=[ig(c, f"Cinematic reel {i}") for i, c in enumerate(reels.get('cinematic', []), 1)]),
]

def esc(s): return html.escape(s, quote=True)

def slide(it):
    t = esc(it['title'])
    if it['kind'] == 'yt':
        return f'''          <div class="work__slide">
            <button class="work__shot-btn" type="button" data-video-id="{it['id']}" data-video-title="{t}" aria-label="Play film: {t}">
              <img class="work__shot" src="/films/{it['id']}.jpg" alt="{t}" loading="lazy" decoding="async" width="1280" height="720">
              <span class="work__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>
              <span class="work__caption">{t}</span>
            </button>
          </div>'''
    return f'''          <div class="work__slide work__slide--reel">
            <a class="work__shot-btn" href="https://www.instagram.com/reel/{it['id']}/" target="_blank" rel="noopener noreferrer" aria-label="Watch on Instagram: {t}">
              <img class="work__shot" src="/reels/{it['id']}.jpg" alt="{t}" loading="lazy" decoding="async" width="640" height="800">
              <span class="work__play work__play--ig" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>
              <span class="work__caption">{t} <span class="work__ext">Instagram</span></span>
            </a>
          </div>'''

def dots(n, label):
    b = [f'          <button class="work__dot{" is-active" if i==0 else ""}" type="button" aria-label="Item {i+1} of {n}"></button>' for i in range(n)]
    return f'''        <div class="work__dots" role="tablist" aria-label="{esc(label)}">
{chr(10).join(b)}
        </div>'''

def reel_mod(items):
    return ' work__slider--reel' if items and all(i['kind'] == 'ig' for i in items) else ''

def project(p):
    badge = f'<span class="work__badge">{esc(p["badge"])}</span>' if p["badge"] else ''
    n = len(p['items'])
    unit = 'film' if n == 1 else 'films'
    return f'''    <article class="work__item">
      <div class="work__head">
        <div class="work__meta">{badge}<span class="work__year">{esc(p["year"])}</span><span class="work__count">{n} {unit}</span></div>
        <h3 class="work__name"><span class="work__name-link is-bend" data-bend>{esc(p["client"])}</span></h3>
        <p class="work__lead">{esc(p["lead"])}</p>
        <p class="work__blurb">{esc(p["blurb"])}</p>
      </div>
      <div class="work__slider{reel_mod(p['items'])}" data-slider-status>
        <div class="work__viewport"><div class="work__track" data-grab>
{chr(10).join(slide(i) for i in p['items'])}
        </div></div>
{dots(n, p["client"])}
      </div>
    </article>'''

def category(c):
    n = len(c['items'])
    return f'''    <section class="cat" id="{c['slug']}">
      <h2 class="cat__title">{esc(c['title'])}</h2>
      <p class="cat__note">{esc(c['note'])}</p>
      <p class="cat__count">{n} {'film' if n==1 else 'films'}</p>
      <div class="work__slider{reel_mod(c['items'])}" data-slider-status>
        <div class="work__viewport"><div class="work__track" data-grab>
{chr(10).join(slide(i) for i in c['items'])}
        </div></div>
{dots(n, c['title'])}
      </div>
    </section>'''

pathlib.Path('scripts/_work.html').write_text("\n\n".join(project(p) for p in HEALTHCARE), encoding='utf-8')
pathlib.Path('scripts/_other.html').write_text("\n\n".join(category(c) for c in OTHER), encoding='utf-8')
tot_h = sum(len(p['items']) for p in HEALTHCARE)
tot_o = sum(len(c['items']) for c in OTHER)
print(f"homepage: {len(HEALTHCARE)} groups / {tot_h} items")
print(f"other-work: {len(OTHER)} categories / {tot_o} items")
print(f"TOTAL: {tot_h + tot_o}")
