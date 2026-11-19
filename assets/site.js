function scrollToSection(section) {
    section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function localToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
        let activeId = sections[0].id;
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

// Enhance the generated HTML without fetching or replacing its content.
setupCollectionToggle(document.getElementById('news-container'), 'news-toggle', 3, 'View older news');
setupCollectionToggle(document.getElementById('talks-container'), 'talks-toggle', 4, 'Show more talks');
document.querySelectorAll('.talk-card').forEach(function(card) {
    card.classList.toggle('upcoming', card.dataset.type === 'presentation' && card.dataset.date > localToday());
});

(function() {
    const papers = Array.from(document.querySelectorAll('.paper'));
    const filters = document.querySelectorAll('.filter-btn');
    const button = document.getElementById('show-more-btn');
    const container = document.getElementById('publications-container');
    const empty = document.createElement('p');
    empty.className = 'content-status';
    empty.setAttribute('role', 'status');
    empty.textContent = 'No publications in this category yet.';
    empty.hidden = true;
    if (papers.length) container.appendChild(empty);
    let category = 'all';
    let expanded = false;
    filters.forEach(function(filter) { filter.disabled = !papers.length; });
    button.disabled = !papers.length;
    function render() {
        const matching = papers.filter(function(paper) { return category === 'all' || paper.dataset.category === category; });
        papers.forEach(function(paper) {
            const index = matching.indexOf(paper);
            paper.classList.toggle('hidden', index < 0 || (!expanded && index >= 5));
        });
        empty.hidden = matching.length > 0;
        button.classList.toggle('hidden', matching.length <= 5);
        button.classList.toggle('expanded', expanded);
        button.setAttribute('aria-expanded', String(expanded));
        button.querySelector('.show-more-text').textContent = expanded ? 'Show Less' : 'Show More';
    }
    filters.forEach(function(filter) {
        filter.addEventListener('click', function() {
            category = filter.dataset.filter;
            expanded = false;
            filters.forEach(function(item) {
                const active = item === filter;
                item.classList.toggle('active', active);
                item.setAttribute('aria-pressed', String(active));
            });
            render();
        });
    });
    button.addEventListener('click', function() {
        expanded = !expanded;
        render();
        if (!expanded) scrollToSection(document.getElementById('publications'));
    });
    render();
})();
