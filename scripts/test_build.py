"""Regression checks for generated content and discovery metadata."""
import json
import unittest
from html.parser import HTMLParser
from unittest.mock import patch
import xml.etree.ElementTree as ET

from build import ROOT, SITE, news_card, paper_card, render


class ContentParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.attrs = []
        self.text = []

    def handle_starttag(self, tag, attrs):
        self.attrs.append((tag, dict(attrs)))

    def handle_data(self, data):
        self.text.append(data)


class BuildTests(unittest.TestCase):
    def test_initial_html_contains_all_content(self):
        page = ContentParser()
        page.feed(render())
        text = ''.join(page.text)
        for group, field in [('publications', 'title'), ('news', 'description'), ('talks', 'talkTitle')]:
            records = json.loads((ROOT / f'content/{group}.json').read_text(encoding='utf-8'))[group]
            for record in records:
                self.assertIn(record[field], text)
        self.assertIn('published scientific evidence', text)
        for tag, attrs in page.attrs:
            if attrs.get('class') in ('paper', 'timeline-card', 'talk-card'):
                self.assertNotIn('hidden', attrs)
        self.assertNotIn('Enable JavaScript to load', text)

    def test_metadata(self):
        page = ContentParser()
        page.feed(render())
        canonical = [a['href'] for t, a in page.attrs if t == 'link' and a.get('rel') == 'canonical']
        self.assertEqual(canonical, [SITE])
        self.assertTrue(any(t == 'meta' and a.get('name') == 'description' and a.get('content') for t, a in page.attrs))
        person = next(json.loads(t) for t in page.text if t.startswith('{"@context"'))
        self.assertEqual(person['@type'], 'Person')
        self.assertEqual(person['jobTitle'], 'Head of AI')
        self.assertEqual(person['worksFor']['name'], 'Bios Life')
        links = {a.get('href') for t, a in page.attrs if t == 'a'}
        self.assertTrue(set(person['sameAs']) <= links)
        urls = ET.parse(ROOT / 'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
        self.assertEqual([u.text for u in urls], [SITE])
        self.assertIn(f'Sitemap: {SITE}sitemap.xml', (ROOT / 'robots.txt').read_text())

    def test_escaping_and_primary_link(self):
        paper = {'title': '<script>alert("x")</script>', 'authors': 'A & B, Thomas Pierrot.', 'year': 2026,
                 'venue': '<Venue>', 'category': 'bio-ai', 'highlights': ['Cover & award'],
                 'links': [{'text': 'Paper', 'url': 'https://example.com/?a=1&b=2'}, {'text': '<Code>', 'url': 'https://example.com/code'}]}
        result = paper_card(paper)
        self.assertNotIn('<script>', result)
        self.assertIn('&lt;Code&gt;', result)
        self.assertIn('<strong>Thomas Pierrot</strong>', result)
        self.assertIn('href="https://example.com/?a=1&amp;b=2"', result)
        self.assertNotIn('timeline-link', news_card({'date': '2026', 'description': '<test>', 'link': ''}))
        self.assertIn('&lt;test&gt;', news_card({'date': '2026', 'description': '<test>'}))

    def test_empty_collections(self):
        original = json.loads
        def empty(source):
            data = original(source)
            return {key: [] for key in data}
        with patch('build.json.loads', side_effect=empty):
            output = render()
        for message in ['No news yet.', 'No publications in this category yet.', 'No talks yet.']:
            self.assertIn(message, output)


if __name__ == '__main__':
    unittest.main()
