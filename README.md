# Thomas Pierrot's personal website

Static HTML, CSS, and JavaScript served by GitHub Pages. The generated HTML is committed, so GitHub Pages needs no build step or package installation. Maintainers regenerate it with Python after content changes.

## Preview locally

From the repository root, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. Use the local HTTP preview to match production behavior; content is already included in the HTML. Stop the server with Ctrl+C.

## Files and content

- `templates/index.html`: editable page structure, profile/social links, education, and experience.
- `index.html`: generated page including all biography, news, publications, and talks. Do not edit directly.
- `scripts/build.py`: dependency-free generator and search metadata (description, canonical URL, Person JSON-LD).
- `assets/styles.css`: layout, themes, responsive styles, and reduced-motion rules.
- `assets/site.js`: theme/banner controls, navigation, publication filters, and archive toggles.
- `content/about.md`: paragraphs separated by blank lines, `**bold**`, and trusted raw HTML (including links). This is a small formatter, not a full Markdown parser; headings and Markdown link syntax are not supported. Only maintainers should supply this HTML.
- `content/news.json`: a `news` array in display order. Each entry has `date` and plain-text `description`; optional `link` may be omitted or empty. Linked entries also need `linkTitle` and `linkIcon` (Font Awesome classes).
- `content/publications.json`: a `publications` array with `title`, plain-text `authors`, `venue`, integer `year`, `category` (`bio-ai` or `fundamental-ai`), optional string-array `highlights`, and `links` containing `text`/`url`. Publications sort by year descending, retaining file order for ties. Thomas Pierrot's name is emphasized automatically. The first item in `links` is the publication title's destination (use the paper or preprint); subsequent links appear as labeled buttons, so append Code or Project links after the paper.
- `content/talks.json`: a `talks` array with `venue`, `talkTitle`, `location`, display `date`, sortable `dateISO` (`YYYY-MM-DD`), `type` (`presentation` or `video`), and `video` or `link` URL. Keep the two dates consistent. Future presentations are styled as upcoming based on the visitor's local calendar date; no manual status is needed. This styling does not assert that past events occurred.
- `banners/banner_{desktop,tablet,mobile}_{morning,day,afternoon,night}.jpeg`: twelve banner variants. `profile_picture.jpg` is the profile image.
- `CNAME`: custom domain configuration; retain it when deploying.

JSON text fields are rendered as text, not HTML. External content links should use HTTPS. Google Fonts and Font Awesome load from external CDNs; the site uses system font fallbacks if fonts are unavailable.

## Validation

With Python 3.9+ and Node.js installed:

```sh
python3 scripts/validate.py
python3 scripts/build.py --check
python3 scripts/test_build.py
node --check assets/site.js
```

The validator checks content fields, URLs, dates, local HTML and CSS references, fragment targets, and banner variants. It does not check external link availability or factual accuracy. GitHub Actions runs these checks on pull requests and pushes to `main`.

Before merging, preview at desktop and narrow mobile widths and check:

1. All content sections load; Scholar points to the intended profile; news without a link has no link button.
2. Theme toggling, all four banners, and section navigation work.
3. Each publication filter and Show More/Show Less work, including their keyboard focus and selected/expanded state.
4. Text remains readable without clipping at enlarged text sizes; reduced-motion settings disable animated scrolling and transitions.
5. With JavaScript disabled, the biography and every news item, publication, and talk remain visible. With JavaScript enabled, the usual initial limits (3 news, 5 publications, 4 talks) and filters apply without content requests.
6. With JavaScript disabled, the default banner remains visible and script-dependent controls are hidden. With JavaScript enabled, only the time-selected banner has an image source; the default exists only in a `noscript` fallback.

## Updating content

Edit `content/` files or `templates/index.html`, then run:

```sh
python3 scripts/validate.py
python3 scripts/build.py
python3 scripts/build.py --check
python3 scripts/test_build.py
node --check assets/site.js
```

Commit the edited sources and regenerated `index.html` together. CI rejects stale generated HTML. The generator preserves publication order for tied years and sorts talks by `dateISO`. Upcoming styling is applied in the browser using the visitor's current date so generated HTML does not become stale as time passes. Keep the Person metadata in `scripts/build.py` consistent with the visible profile when changing roles or profile links.

## Search discovery

`robots.txt` allows crawling and points to `sitemap.xml`, which lists the canonical homepage. The sitemap deliberately omits `lastmod` rather than claiming a new update on every build. Search metadata and structured data describe the visible profile; they do not guarantee search placement or inclusion in AI answers.

After deployment, a verified owner or full user can inspect `https://thomaspierrot.com/` in Google Search Console and select **Request indexing**, then submit `https://thomaspierrot.com/sitemap.xml` in Sitemaps. This is an account action, not part of this build or deployment. See [Google's recrawling guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl). Search results can take time to reflect updates; requesting repeatedly does not speed up crawling.
