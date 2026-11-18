"""Validate the static site's content and local references using Python's stdlib."""
import datetime
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text(record, key):
    require(isinstance(record.get(key), str) and record[key].strip(), f'Missing text field: {key}')


def url(value):
    parsed = urlsplit(value)
    require(parsed.scheme in ('https', 'http') and parsed.netloc, f'Invalid URL: {value}')


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.fragments = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            require(attrs['id'] not in self.ids, f'Duplicate ID: {attrs["id"]}')
            self.ids.add(attrs['id'])
        for key in ('href', 'src', 'srcset'):
            value = attrs.get(key)
            if value is None:
                continue
            require(bool(value), f'Empty {key} on {tag}')
            if value.startswith('#'):
                self.fragments.append(value[1:])
            elif not urlsplit(value).scheme:
                require((ROOT / value).is_file(), f'Missing asset: {value}')


page = Page()
page.feed((ROOT / 'index.html').read_text())
require(set(page.fragments) <= page.ids, 'Missing fragment target')
for group in ('news', 'publications', 'talks'):
    entries = json.loads((ROOT / 'content' / f'{group}.json').read_text())[group]
    require(isinstance(entries, list), f'{group} must be an array')
    for entry in entries:
        if group == 'news':
            for key in ('date', 'description'):
                text(entry, key)
            if entry.get('link'):
                url(entry['link'])
                text(entry, 'linkTitle')
                text(entry, 'linkIcon')
        elif group == 'publications':
            for key in ('title', 'authors', 'venue'):
                text(entry, key)
            require(type(entry.get('year')) is int, 'Publication year must be an integer')
            require(entry.get('category') in ('bio-ai', 'fundamental-ai'), 'Unknown category')
            require(isinstance(entry.get('highlights', []), list), 'Highlights must be an array')
            require(all(isinstance(h, str) for h in entry.get('highlights', [])), 'Highlights must be text')
            require(isinstance(entry.get('links'), list) and entry['links'], 'Publication links required')
            for link in entry['links']:
                text(link, 'text')
                url(link['url'])
        else:
            for key in ('venue', 'talkTitle', 'location', 'date', 'dateISO'):
                text(entry, key)
            require(datetime.date.fromisoformat(entry['dateISO']).isoformat() == entry['dateISO'], 'Use YYYY-MM-DD dates')
            require(entry.get('type') in ('video', 'presentation'), 'Unknown talk type')
            url(entry.get('video') or entry.get('link', ''))
            require('status' not in entry, 'Upcoming status is derived from dateISO')
    print(f'{group}: {len(entries)} valid entries')
for size in ('desktop', 'tablet', 'mobile'):
    for time in ('morning', 'day', 'afternoon', 'night'):
        require((ROOT / 'banners' / f'banner_{size}_{time}.jpeg').is_file(), 'Missing banner variant')
require((ROOT / 'profile_picture.jpg').is_file(), 'Missing profile image')
require((ROOT / 'content/about.md').is_file(), 'Missing biography')
print('HTML references and all banner variants valid.')
