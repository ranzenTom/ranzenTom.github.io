"""Generate crawlable HTML from the template and content files (stdlib only)."""
import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://thomaspierrot.com/'


def esc(value):
    return html.escape(str(value), quote=True)


def anchor(url, text, attrs=''):
    return f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer"{attrs}>{text}</a>'


def status(message):
    return f'<p class="content-status" role="status">{message}</p>'


def news_card(item):
    link = ''
    if (item.get('link') or '').strip():
        label = esc(item['linkTitle'])
        link = anchor(item['link'], f'<i class="{esc(item["linkIcon"])}" aria-hidden="true"></i>',
                      f' class="timeline-link" title="{label}" aria-label="{label}"')
    return f'<div class="timeline-card"><span class="timeline-badge">{esc(item["date"])}</span><p>{esc(item["description"])}</p>{link}</div>'


def paper_card(item):
    title = anchor(item['links'][0]['url'], esc(item['title']), ' class="paper-title"')
    authors = esc(item['authors']).replace('Thomas Pierrot', '<strong>Thomas Pierrot</strong>')
    highlights = ''.join(f'<span class="highlight-item">{"🏆" if "Cover" in h else "⭐"} {esc(h)}</span>' for h in item.get('highlights', []))
    links = ''.join(anchor(link['url'], esc(link['text'])) for link in item['links'][1:])
    return (f'<div class="paper" data-category="{esc(item["category"])}">'
            f'<div class="paper-header">{title}<div class="paper-venue-info"><span class="year-text">{item["year"]}</span><span class="venue-badge">{esc(item["venue"])}</span></div></div>'
            f'<div class="paper-meta">{authors}</div>'
            + (f'<div class="paper-highlights">{highlights}</div>' if highlights else '')
            + (f'<div class="paper-links">{links}</div>' if links else '') + '</div>')


def talk_card(item):
    video = item['type'] == 'video'
    label, icon, action = ('Video', 'play', 'Watch Video') if video else ('Talk', 'microphone', 'View Details')
    body = (f'<div class="talk-header"><span class="talk-type-badge"><i class="fa-solid fa-{icon}"></i> {label}</span><h3 class="talk-title">{esc(item["venue"])}</h3></div>'
            f'<p class="talk-subtitle">{esc(chr(34) + item["talkTitle"] + chr(34))}</p>'
            '<div class="talk-details">'
            f'<div class="talk-detail-item"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>{esc(item["location"])}</span></div>'
            f'<div class="talk-detail-item"><i class="fa-solid fa-calendar" aria-hidden="true"></i><span>{esc(item["date"])}</span></div></div>'
            f'<div class="talk-link"><span>{action}</span><i class="fa-solid fa-arrow-right"></i></div>')
    return anchor(item.get('video') or item['link'], body,
                  f' class="talk-card" data-type="{esc(item["type"])}" data-date="{esc(item["dateISO"])}"')


def render():
    template = (ROOT / 'templates/index.html').read_text(encoding='utf-8')
    about = (ROOT / 'content/about.md').read_text(encoding='utf-8').strip()
    # Same deliberately small Markdown subset as before: trusted HTML and bold.
    biography = '\n'.join('<p>' + re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', p) + '</p>' for p in re.split(r'\n\n+', about)) if about else status('Biography coming soon.')
    data = {key: json.loads((ROOT / f'content/{key}.json').read_text(encoding='utf-8'))[key] for key in ('news', 'publications', 'talks')}
    description = 'Thomas Pierrot, Head of AI at Bios Life. AI research and clinical products for personalized cancer screening, foundation models, and reinforcement learning.'
    person = {
        '@context': 'https://schema.org', '@type': 'Person', '@id': SITE + '#person',
        'name': 'Thomas Pierrot', 'url': SITE, 'image': SITE + 'profile_picture.jpg',
        'jobTitle': 'Head of AI', 'worksFor': {'@type': 'Organization', 'name': 'Bios Life', 'url': 'https://www.bioslife.ai/'},
        'sameAs': ['https://scholar.google.com/citations?user=KZJH9swAAAAJ&hl=en', 'https://github.com/ranzenTom', 'https://www.linkedin.com/in/thomas-pierrot-120a43128/', 'https://x.com/thomas_pierrot']
    }
    metadata = f'<meta name="description" content="{esc(description)}">\n    <link rel="canonical" href="{SITE}">\n    <script type="application/ld+json">{json.dumps(person, ensure_ascii=False).replace("<", chr(92) + "u003c")}</script>'
    replacements = {
        'metadata': metadata, 'about': biography,
        'news': '\n'.join(map(news_card, data['news'])) or status('No news yet.'),
        'publications': '\n'.join(map(paper_card, sorted(data['publications'], key=lambda p: -p['year']))) or status('No publications in this category yet.'),
        'talks': '\n'.join(map(talk_card, sorted(data['talks'], key=lambda t: t['dateISO'], reverse=True))) or status('No talks yet.')
    }
    for key, value in replacements.items():
        token = '{{' + key + '}}'
        if template.count(token) != 1:
            raise ValueError(f'Expected one {token} in template')
        template = template.replace(token, value)
    return template


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if committed HTML is stale')
    args = parser.parse_args()
    result = render()
    target = ROOT / 'index.html'
    if args.check:
        if target.read_text(encoding='utf-8') != result:
            raise SystemExit('index.html is stale. Run python3 scripts/build.py and commit the output.')
        print('Generated HTML is up to date.')
    else:
        target.write_text(result, encoding='utf-8')
        print('Generated index.html.')


if __name__ == '__main__':
    main()
