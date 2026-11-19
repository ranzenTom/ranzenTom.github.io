// Repository content is trusted; only about.md intentionally supports raw HTML.
function showStatus(id, message) {
    const container = document.getElementById(id);
    const status = document.createElement('p');
    status.className = 'content-status';
    status.setAttribute('role', 'status');
    status.textContent = message;
    container.replaceChildren(status);
    container.setAttribute('aria-busy', 'false');
}

function prepareContent(id) {
    const container = document.getElementById(id);
    container.replaceChildren();
    container.setAttribute('aria-busy', 'false');
    return container;
}

function scrollToSection(section) {
    section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function localToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Set loading states only when JavaScript actually runs.
for (const [id, label] of Object.entries({
    'about-content': 'biography', 'news-container': 'news',
    'publications-container': 'publications', 'talks-container': 'talks'
})) {
    showStatus(id, `Loading ${label}…`);
    document.getElementById(id).setAttribute('aria-busy', 'true');
}

// Banner time-of-day logic with manual override
(function() {
    const timeButtons = document.querySelectorAll('.time-btn');

    // Set banner to a specific time of day
    function setBanner(timeOfDay) {
        document.getElementById('banner-desktop').srcset = `banners/banner_desktop_${timeOfDay}.jpeg`;
        document.getElementById('banner-tablet').srcset = `banners/banner_tablet_${timeOfDay}.jpeg`;
        document.getElementById('banner-mobile').src = `banners/banner_mobile_${timeOfDay}.jpeg`;

        document.getElementById('banner-picture').hidden = false;

        // Update active state on buttons
        timeButtons.forEach(function(btn) {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', String(btn.getAttribute('data-time') === timeOfDay));
            if (btn.getAttribute('data-time') === timeOfDay) {
                btn.classList.add('active');
            }
        });
    }

    // Detect current time of day
    function detectTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 7 && hour < 10) {
            return 'morning';
        } else if (hour >= 10 && hour < 17) {
            return 'day';
        } else if (hour >= 17 && hour < 20) {
            return 'afternoon';
        } else {
            return 'night';
        }
    }

    // Initialize with auto-detected time
    setBanner(detectTimeOfDay());

    // Add click handlers to time buttons
    timeButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const timeOfDay = this.getAttribute('data-time');
            setBanner(timeOfDay);
        });
    });
})();

// Theme toggle logic
(function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    const html = document.documentElement;

    let savedTheme = null;
    try { savedTheme = localStorage.getItem('theme'); } catch { /* Storage may be blocked. */ }
    if (!['light', 'dark'].includes(savedTheme)) savedTheme = null;

    // Get saved theme or detect system preference
    function getPreferredTheme() {
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply theme and update icon
    function setTheme(theme) {
        themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            html.removeAttribute('data-theme');
            themeIcon.className = 'fa-solid fa-moon';
        }
    }

    // Initialize theme
    setTheme(getPreferredTheme());

    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        savedTheme = newTheme;
        try { localStorage.setItem('theme', newTheme); } catch { /* Keep the choice for this page visit. */ }
    });

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        // Only update if user hasn't set a manual preference
        if (!savedTheme) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
})();

// Navigation scroll effect and scrollspy
(function() {
    const nav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function handleScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 100);
        const marker = nav.offsetHeight + 80;
        let activeId = '';
        sections.forEach(function(section) {
            if (section.getBoundingClientRect().top <= marker) activeId = section.id;
        });
        if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
            activeId = sections[sections.length - 1].id;
        }
        navLinks.forEach(function(link) {
            const active = link.getAttribute('href') === '#' + activeId;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(handleScroll);
        sections.forEach(function(section) { observer.observe(section); });
    }
    handleScroll();

    // Smooth scroll with offset for nav links
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                scrollToSection(targetSection);
            }
        });
    });
})();

// Load and render about content from Markdown
(function() {
    fetch('content/about.md')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load about content');
            }
            return response.text();
        })
        .then(function(markdown) {
            const container = prepareContent('about-content');
            if (!markdown.trim()) { showStatus('about-content', 'Biography coming soon.'); return; }
            // Split by double newlines to get paragraphs
            const paragraphs = markdown.trim().split(/\n\n+/);
            const html = paragraphs.map(function(p) {
                // Convert **text** to <strong>text</strong>
                const converted = p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                return '<p>' + converted + '</p>';
            }).join('\n');
            container.innerHTML = html;
        })
        .catch(function(error) {
            console.error('Error loading about content:', error);
            showStatus('about-content', 'Unable to load about content. Please reload to try again.');
        });
})();

// Keep recent items visible, with an accessible archive toggle.
function setupCollectionToggle(container, buttonId, limit, moreLabel) {
    const button = document.getElementById(buttonId);
    const cards = Array.from(container.children);
    if (cards.length <= limit) return;
    button.hidden = false;
    function render(expanded) {
        cards.forEach(function(card, index) { card.hidden = !expanded && index >= limit; });
        button.setAttribute('aria-expanded', String(expanded));
        button.textContent = expanded ? 'Show less' : moreLabel;
    }
    render(false);
    button.addEventListener('click', function() {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        render(expanded);
        if (!expanded) scrollToSection(container.closest('section'));
    });
}

// Load and render news from JSON
(function() {
    fetch('content/news.json')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load news data');
            }
            return response.json();
        })
        .then(function(data) {
            if (!Array.isArray(data.news)) throw new Error('Invalid news data');
            const container = prepareContent('news-container');
            if (!data.news.length) { showStatus('news-container', 'No news yet.'); return; }

            data.news.forEach(function(newsItem) {
                const card = createNewsCard(newsItem);
                container.appendChild(card);
            });
            setupCollectionToggle(container, 'news-toggle', 3, 'View older news');
        })
        .catch(function(error) {
            console.error('Error loading news:', error);
            showStatus('news-container', 'Unable to load news. Please reload to try again.');
        });

    function createNewsCard(newsItem) {
        const card = document.createElement('div');
        card.className = 'timeline-card';

        const badge = document.createElement('span');
        badge.className = 'timeline-badge';
        badge.textContent = newsItem.date;

        const description = document.createElement('p');
        description.textContent = newsItem.description;

        card.appendChild(badge);
        card.appendChild(description);
        if (newsItem.link && newsItem.link.trim()) {
            const link = document.createElement('a');
            link.className = 'timeline-link';
            link.href = newsItem.link;
            link.title = newsItem.linkTitle;
            link.setAttribute('aria-label', newsItem.linkTitle);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            const icon = document.createElement('i');
            icon.className = newsItem.linkIcon;
            icon.setAttribute('aria-hidden', 'true');
            link.appendChild(icon);
            card.appendChild(link);
        }

        return card;
    }
})();

// Load and render publications from JSON
(function() {
    let allPublications = [];
    let currentFilter = 'all';
    let showingAll = false;
    const INITIAL_DISPLAY_COUNT = 5;

    fetch('content/publications.json')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load publications data');
            }
            return response.json();
        })
        .then(function(data) {
            if (!Array.isArray(data.publications)) throw new Error('Invalid publications data');
            allPublications = data.publications;
            document.querySelectorAll('.filter-btn, #show-more-btn').forEach(btn => { btn.disabled = !allPublications.length; });
            renderPublications();
            setupFilterButtons();
            setupShowMoreButton();
        })
        .catch(function(error) {
            console.error('Error loading publications:', error);
            document.querySelectorAll('.filter-btn, #show-more-btn').forEach(btn => { btn.disabled = true; });
            document.getElementById('show-more-btn').classList.add('hidden');
            showStatus('publications-container', 'Unable to load publications. Please reload to try again.');
        });

    function renderPublications() {
        const container = prepareContent('publications-container');

        // Sort by year descending (most recent first)
        const sortedPublications = allPublications.slice().sort(function(a, b) { return b.year - a.year; });

        const filteredPublications = currentFilter === 'all'
            ? sortedPublications
            : sortedPublications.filter(function(pub) { return pub.category === currentFilter; });

        if (!filteredPublications.length) showStatus('publications-container', 'No publications in this category yet.');

        const displayCount = showingAll ? filteredPublications.length : Math.min(INITIAL_DISPLAY_COUNT, filteredPublications.length);

        filteredPublications.forEach(function(publication, index) {
            const paper = createPaperElement(publication);
            if (index >= displayCount) {
                paper.classList.add('hidden');
            }
            container.appendChild(paper);
        });

        updateShowMoreButton(filteredPublications.length);
    }

    function updateShowMoreButton(totalCount) {
        const showMoreBtn = document.getElementById('show-more-btn');
        showMoreBtn.setAttribute('aria-expanded', String(showingAll));
        const showMoreText = showMoreBtn.querySelector('.show-more-text');

        if (totalCount <= INITIAL_DISPLAY_COUNT) {
            showMoreBtn.classList.add('hidden');
        } else {
            showMoreBtn.classList.remove('hidden');
            if (showingAll) {
                showMoreText.textContent = 'Show Less';
                showMoreBtn.classList.add('expanded');
            } else {
                showMoreText.textContent = 'Show More';
                showMoreBtn.classList.remove('expanded');
            }
        }
    }

    function setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterButtons.forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
                this.setAttribute('aria-pressed', 'true');
                this.classList.add('active');
                currentFilter = this.getAttribute('data-filter');
                showingAll = false;
                renderPublications();
            });
        });
    }

    function setupShowMoreButton() {
        const showMoreBtn = document.getElementById('show-more-btn');

        showMoreBtn.addEventListener('click', function() {
            showingAll = !showingAll;
            const papers = document.querySelectorAll('.paper');

            papers.forEach(function(paper, index) {
                if (showingAll) {
                    paper.classList.remove('hidden');
                } else if (index >= INITIAL_DISPLAY_COUNT) {
                    paper.classList.add('hidden');
                }
            });

            updateShowMoreButton(papers.length);

            // Scroll to publications section if collapsing
            if (!showingAll) {
                scrollToSection(document.getElementById('publications'));
            }
        });
    }

    function createPaperElement(publication) {
        const paper = document.createElement('div');
        paper.className = 'paper';
        paper.setAttribute('data-category', publication.category);

        // Create header with linked title, venue, and year
        const header = document.createElement('div');
        header.className = 'paper-header';

        const title = document.createElement('a');
        title.className = 'paper-title';
        title.textContent = publication.title;
        title.href = publication.links[0].url;
        title.target = '_blank';
        title.rel = 'noopener noreferrer';

        const links = document.createElement('div');
        links.className = 'paper-links';

        publication.links.slice(1).forEach(function(link) {
            const anchor = document.createElement('a');
            anchor.href = link.url;
            anchor.textContent = link.text;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            links.appendChild(anchor);
        });

        header.appendChild(title);


        // Create authors meta
        const meta = document.createElement('div');
        meta.className = 'paper-meta';
        publication.authors.split(/(Thomas Pierrot)/).forEach(function(part) {
            if (part === 'Thomas Pierrot') {
                const author = document.createElement('strong');
                author.textContent = part;
                meta.appendChild(author);
            } else { meta.appendChild(document.createTextNode(part)); }
        });

        // Place publication metadata at the top right
        const venueInfo = document.createElement('div');
        venueInfo.className = 'paper-venue-info';

        const venueBadge = document.createElement('span');
        venueBadge.className = 'venue-badge';
        venueBadge.textContent = publication.venue;
        venueInfo.appendChild(venueBadge);

        const yearText = document.createElement('span');
        yearText.className = 'year-text';
        yearText.textContent = publication.year;
        venueInfo.insertBefore(yearText, venueBadge);

        header.appendChild(venueInfo);

        const highlights = document.createElement('div');
        highlights.className = 'paper-highlights';
        if (publication.highlights && publication.highlights.length > 0) {
            publication.highlights.forEach(function(highlight) {
                const highlightItem = document.createElement('span');
                highlightItem.className = 'highlight-item';
                const icon = highlight.includes('Cover') ? '🏆' : '⭐';
                highlightItem.textContent = icon + ' ' + highlight;
                highlights.appendChild(highlightItem);
            });
        }

        paper.appendChild(header);
        paper.appendChild(meta);
        if (highlights.childElementCount) paper.appendChild(highlights);
        if (links.childElementCount) paper.appendChild(links);

        return paper;
    }
})();

// Load and render talks from JSON
(function() {
    fetch('content/talks.json')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load talks data');
            }
            return response.json();
        })
        .then(function(data) {
            if (!Array.isArray(data.talks)) throw new Error('Invalid talks data');
            const container = prepareContent('talks-container');
            if (!data.talks.length) { showStatus('talks-container', 'No talks yet.'); return; }

            // Sort talks by date (most recent first)
            const sortedTalks = data.talks.sort(function(a, b) {
                return b.dateISO.localeCompare(a.dateISO);
            });

            sortedTalks.forEach(function(talk) {
                const card = createTalkCard(talk);
                container.appendChild(card);
            });
            setupCollectionToggle(container, 'talks-toggle', 4, 'Show more talks');
        })
        .catch(function(error) {
            console.error('Error loading talks:', error);
            showStatus('talks-container', 'Unable to load talks. Please reload to try again.');
        });

    function createTalkCard(talk) {
        const card = document.createElement('a');
        card.className = 'talk-card' + (talk.type === 'presentation' && talk.dateISO > localToday() ? ' upcoming' : '');
        card.href = talk.video || talk.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        // Create header section
        const header = document.createElement('div');
        header.className = 'talk-header';

        const typeBadge = document.createElement('span');
        typeBadge.className = 'talk-type-badge';

        if (talk.type === 'video') {
            typeBadge.innerHTML = '<i class="fa-solid fa-play"></i> Video';
        } else {
            typeBadge.innerHTML = '<i class="fa-solid fa-microphone"></i> Talk';
        }

        const venue = document.createElement('h3');
        venue.className = 'talk-title';
        venue.textContent = talk.venue;

        header.appendChild(typeBadge);
        header.appendChild(venue);

        // Create talk title section (the actual talk name)
        const talkTitleEl = document.createElement('p');
        talkTitleEl.className = 'talk-subtitle';
        talkTitleEl.textContent = '"' + talk.talkTitle + '"';

        // Create details section
        const details = document.createElement('div');
        details.className = 'talk-details';

        const locationItem = document.createElement('div');
        locationItem.className = 'talk-detail-item';
        locationItem.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i><span></span>';
        locationItem.querySelector('span').textContent = talk.location;

        const dateItem = document.createElement('div');
        dateItem.className = 'talk-detail-item';
        dateItem.innerHTML = '<i class="fa-solid fa-calendar" aria-hidden="true"></i><span></span>';
        dateItem.querySelector('span').textContent = talk.date;

        details.appendChild(locationItem);
        details.appendChild(dateItem);

        // Create link button
        const linkButton = document.createElement('div');
        linkButton.className = 'talk-link';

        if (talk.type === 'video') {
            linkButton.innerHTML = '<span>Watch Video</span><i class="fa-solid fa-arrow-right"></i>';
        } else {
            linkButton.innerHTML = '<span>View Details</span><i class="fa-solid fa-arrow-right"></i>';
        }

        // Assemble the card
        card.appendChild(header);
        card.appendChild(talkTitleEl);
        card.appendChild(details);
        card.appendChild(linkButton);

        return card;
    }
})();
