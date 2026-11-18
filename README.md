# Thomas Pierrot's personal website

Static HTML, CSS, and JavaScript served by GitHub Pages. No build step or package installation is required.

## Preview locally

From the repository root, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. Use HTTP rather than opening `index.html` directly: the page fetches its content files. Stop the server with Ctrl+C.

## Files and content

- `index.html`: page structure, profile/social links, education, and experience.
- `assets/styles.css`: layout, themes, responsive styles, and reduced-motion rules.
- `assets/site.js`: content loading, theme/banner controls, navigation, and publication filters.
- `content/about.md`: paragraphs separated by blank lines, `**bold**`, and trusted raw HTML (including links). This is a small formatter, not a full Markdown parser; headings and Markdown link syntax are not supported. Only maintainers should supply this HTML.
- `content/news.json`: a `news` array in display order. Each entry has `date` and plain-text `description`; optional `link` may be omitted or empty. Linked entries also need `linkTitle` and `linkIcon` (Font Awesome classes).
- `content/publications.json`: a `publications` array with `title`, plain-text `authors`, `venue`, integer `year`, `category` (`bio-ai` or `fundamental-ai`), optional string-array `highlights`, and `links` containing `text`/`url`. Publications sort by year descending, retaining file order for ties. Thomas Pierrot's name is emphasized automatically.
- `content/talks.json`: a `talks` array with `venue`, `talkTitle`, `location`, display `date`, sortable `dateISO` (`YYYY-MM-DD`), `type` (`presentation` or `video`), and `video` or `link` URL. Keep the two dates consistent. Future presentations are styled as upcoming based on the visitor's local calendar date; no manual status is needed. This styling does not assert that past events occurred.
- `banners/banner_{desktop,tablet,mobile}_{morning,day,afternoon,night}.jpeg`: twelve banner variants. `profile_picture.jpg` is the profile image.
- `CNAME`: custom domain configuration; retain it when deploying.

JSON text fields are rendered as text, not HTML. External content links should use HTTPS. Google Fonts and Font Awesome load from external CDNs; the site uses system font fallbacks if fonts are unavailable.

## Validation

With Python 3.9+ and Node.js installed:

```sh
python3 scripts/validate.py
node --check assets/site.js
```

The validator checks content fields, URLs, dates, local HTML and CSS references, fragment targets, and banner variants. It does not check external link availability or factual accuracy. GitHub Actions runs these checks on pull requests and pushes to `main`.

Before merging, preview at desktop and narrow mobile widths and check:

1. All content sections load; Scholar points to the intended profile; news without a link has no link button.
2. Theme toggling, all four banners, and section navigation work.
3. Each publication filter and Show More/Show Less work, including their keyboard focus and selected/expanded state.
4. Text remains readable without clipping at enlarged text sizes; reduced-motion settings disable animated scrolling and transitions.
5. Block a content request in browser developer tools and reload: that section displays a useful error; publication controls stay disabled when publications fail. Empty arrays display an empty state.
6. With JavaScript disabled, the default banner and static profile remain visible, section messages explain why content is unavailable, and script-dependent controls are hidden. With JavaScript enabled, only the time-selected banner has an image source; the default exists only in a `noscript` fallback.

This cleanup preserves the existing content. Biography, publication, news, and talk refreshes belong in a separate issue.
