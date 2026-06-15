/* ==========================================================================
   Interactive Engine for MedPulse
   ========================================================================== */

// Base Simulated Article Database
const localArticles = [
    {
        "title": "AI Diagnostics: Machine Learning Outperforms Specialists in Skin Screenings",
        "excerpt": "Trained on millions of clinical images, AI systems show impressive diagnostic precision, facilitating early dermatologist referrals.",
        "category": "Diagnostics",
        "author": "Dr. Angela Rostova",
        "date": "2 hours ago",
        "readTime": "4 min read",
        "body": "<p>Machine learning applications are improving early disease detection. In recent clinical trials, diagnostic software analyzed skin lesions with accuracy levels comparable to board-certified specialists.</p><p>The technology scans high-resolution images of anomalies to check for cellular irregularities. While developers emphasize that these systems are meant to support, rather than replace, human dermatologists, they serve to accelerate the triage process and flag high-risk cases for immediate review.</p><p>As these tools become integrated into mobile clinics, patient access to specialty care stands to improve significantly.</p>",
        "premium": true
    },
    {
        "title": "The Evolution of Remote Patient Care in Rural Communities",
        "excerpt": "High-speed satellite connections and connected monitors enable clinical teams to manage patients with chronic conditions remotely.",
        "category": "Telehealth",
        "author": "Marcus Sterling",
        "date": "4 hours ago",
        "readTime": "5 min read",
        "body": "<p>Remote Patient Monitoring (RPM) is transforming healthcare delivery in rural areas, where specialty clinics are often located hours away.</p><p>Connected devices allow patients with hypertension or diabetes to transmit vital signs to their care teams daily. If reading anomalies are detected, system alerts prompt clinic nurses to conduct video check-ins before complications escalate.</p><p>RPM programs have demonstrated significant reductions in hospitalization rates, illustrating the value of preventative digital care pathways.</p>",
        "premium": false
    },
    {
        "title": "Continuous Glucose Monitors: Expanding Beyond Diabetes Care",
        "excerpt": "Wellness practitioners are recommending wearable metabolic sensors to healthy individuals to track blood sugar spikes and optimize athletic recovery.",
        "category": "Wearables",
        "author": "Sarah Sterling",
        "date": "1 day ago",
        "readTime": "4 min read",
        "body": "<p>Continuous Glucose Monitors (CGMs)\u2014historically a life-saving tool for individuals with Type 1 diabetes\u2014are gaining adoption in the wellness sector.</p><p>Fitness enthusiasts and metabolic health practitioners are utilizing CGMs to monitor real-time blood sugar responses to specific foods and training regimens. The data helps users identify personal insulin triggers and structure daily nutrition to stabilize energy levels.</p><p>While endocrinologists support interest in metabolic health, they advise caution, emphasizing that glucose fluctuations are normal and healthy individuals do not need to stress over minor spikes.</p>",
        "premium": true
    }
];

// Application State
let state = {
    isDarkMode: false,
    bookmarks: [],
    upvoted: [],
    activeCategory: 'all',
    searchQuery: '',
    sortOrder: 'newest',
    currentArticles: [...localArticles],
    activeArticle: null,
    comments: {}, // ArticleTitle -> Array of comments
    pageViews: 1402,
    adClicks: 87,
    earnings: 128.45,
    customFeeds: [],
    isSubscribed: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    setupTheme();
    renderTicker();
    
    // Check if we are on a static compliance page
    const isStaticPage = window.location.pathname.endsWith('about.html') || 
                        window.location.pathname.endsWith('privacy.html') || 
                        window.location.pathname.endsWith('terms.html');
                        
    if (isStaticPage) {
        setupEventListeners();
        updateAnalyticsDisplay(false); // Init display
        return; // Return early, bypassing feed-specific initialization
    }
    
    renderCategories();
    setupEventListeners();
    updateAnalyticsDisplay(false); // Init display
    
    // Parse URL parameters for routing
    const isArticlePage = window.location.pathname.endsWith('article.html');
    const urlParams = new URLSearchParams(window.location.search);
    const artId = urlParams.get('art_id');
    const view = urlParams.get('view');
    const filter = urlParams.get('filter');

    if (filter === 'bookmarks') {
        state.sortOrder = 'bookmarks';
        const sortSelect = document.getElementById('news-sort');
        if (sortSelect) sortSelect.value = 'bookmarks';
    }

    if (isArticlePage) {
        if (artId !== null) {
            const idx = parseInt(artId);
            if (idx >= 0 && idx < localArticles.length) {
                openArticle(localArticles[idx]);
            } else {
                window.location.href = 'index.html';
            }
        } else if (view === 'rss') {
            const savedRssArt = localStorage.getItem('8_med_pulse_active_rss_article');
            const savedRssList = localStorage.getItem('8_med_pulse_rss_articles');
            if (savedRssList) {
                state.currentArticles = JSON.parse(savedRssList);
            }
            if (savedRssArt) {
                openArticle(JSON.parse(savedRssArt));
            } else {
                window.location.href = 'index.html';
            }
        } else if (view === 'about') {
            openAboutPage();
        } else if (view === 'ads') {
            openAdPlacementsPage();
        } else if (view === 'terms') {
            openTermsPage();
        } else {
            window.location.href = 'index.html';
        }
    } else {
        // index.html - Hide detail view and progress bar, show feed view
        const detailView = document.getElementById('article-detail-view');
        if (detailView) detailView.style.display = 'none';
        const feedView = document.getElementById('feed-view');
        if (feedView) feedView.style.display = 'block';
        const progBar = document.getElementById('site-scroll-progress');
        if (progBar) progBar.style.display = 'none';

        // Automatically load default RSS feed on first load
        const defaultRssBtn = document.querySelector('.rss-load-btn');
        if (defaultRssBtn) {
            fetchRSSFeed(defaultRssBtn.dataset.url, defaultRssBtn.dataset.name, true);
        } else {
            renderFeed();
        }
    }
});

// Load state from local storage
function loadStateFromStorage() {
    const savedTheme = localStorage.getItem('8_med_pulse_dark_mode');
    state.isDarkMode = savedTheme === 'true';

    const savedBookmarks = localStorage.getItem('8_med_pulse_bookmarks');
    if (savedBookmarks) {
        state.bookmarks = JSON.parse(savedBookmarks);
    }

    const savedUpvotes = localStorage.getItem('8_med_pulse_upvotes');
    if (savedUpvotes) {
        state.upvoted = JSON.parse(savedUpvotes);
    }

    const savedComments = localStorage.getItem('8_med_pulse_comments');
    if (savedComments) {
        state.comments = JSON.parse(savedComments);
    }

    const savedSub = localStorage.getItem('8_med_pulse_subscribed');
    state.isSubscribed = savedSub === 'true';

    const savedViews = localStorage.getItem('8_med_pulse_pageviews');
    if (savedViews) state.pageViews = parseInt(savedViews);

    const savedClicks = localStorage.getItem('8_med_pulse_adclicks');
    if (savedClicks) state.adClicks = parseInt(savedClicks);

    const savedEarnings = localStorage.getItem('8_med_pulse_earnings');
    if (savedEarnings) state.earnings = parseFloat(savedEarnings);

    // Increment page view on load
    state.pageViews += 1;
    state.earnings += 0.05; // Each page load generates minor simulated ad CPM
    saveStateToStorage();
}

// Save state to storage
function saveStateToStorage() {
    localStorage.setItem('8_med_pulse_dark_mode', state.isDarkMode);
    localStorage.setItem('8_med_pulse_bookmarks', JSON.stringify(state.bookmarks));
    localStorage.setItem('8_med_pulse_upvotes', JSON.stringify(state.upvoted));
    localStorage.setItem('8_med_pulse_comments', JSON.stringify(state.comments));
    localStorage.setItem('8_med_pulse_subscribed', state.isSubscribed);
    localStorage.setItem('8_med_pulse_pageviews', state.pageViews);
    localStorage.setItem('8_med_pulse_adclicks', state.adClicks);
    localStorage.setItem('8_med_pulse_earnings', state.earnings.toFixed(2));
}

// Setup Theme
function setupTheme() {
    if (state.isDarkMode) {
        document.body.classList.add('dark');
        document.getElementById('theme-toggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('dark');
        document.getElementById('theme-toggle').innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

// Toggle Theme
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    setupTheme();
    saveStateToStorage();
    incrementAnalytics(1, 0.10); // Changing theme counts as activity
}

// Render Ticker
function renderTicker() {
    const listEl = document.getElementById('ticker-content-list');
    const items = ["AI diagnostic tools demonstrate 98% accuracy in identifying early-stage skin anomalies", "Telehealth consults show record satisfaction rates among rural clinic outpatients", "Wearable continuous glucose monitors gain approvals for non-diabetic wellness tracking", "Researchers identify key genetic markers linked to targeted immunotherapy responses", "Biomimetic heart valves complete long-term clinical safety milestones in EU trials"];
    
    listEl.innerHTML = items.map(item => `<div class="ticker-item">${item}</div>`).join('');
    
    // Duplicate items to ensure seamless scrolling loop
    listEl.innerHTML += listEl.innerHTML;
}

// Render Category Tabs
function renderCategories() {
    const container = document.getElementById('category-tabs-container');
    const categories = ['all', ...new Set(localArticles.map(a => a.category))];
    
    container.innerHTML = categories.map(cat => {
        const label = cat === 'all' ? 'All News' : cat;
        const activeClass = state.activeCategory === cat ? 'active' : '';
        return `<button class="tab-btn ${activeClass}" data-category="${cat}">${label}</button>`;
    }).join('');
    
    // Add event listeners to new tabs
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.activeCategory = e.target.dataset.category;
            renderFeed();
        });
    });
}

// Generate Custom SVG Thumbnail Placeholder
function getSvgPlaceholder(category, title) {
    // Simple hash to determine color variance
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    const primColor = `hsl(${hue}, 70%, 45%)`;
    const secColor = `hsl(${(hue + 40) % 360}, 60%, 60%)`;
    
    return `
        <svg class="card-placeholder-svg" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad-${hue}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${primColor};stop-opacity:0.85" />
                    <stop offset="100%" style="stop-color:${secColor};stop-opacity:0.85" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad-${hue})" />
            <circle cx="100" cy="80" r="30" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.3" />
            <path d="M 70 80 L 130 80" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2" />
            <text x="10" y="25" fill="#ffffff" font-family="'Courier New', monospace" font-size="10" font-weight="bold" opacity="0.6">${category.toUpperCase()}</text>
            <text x="100" y="145" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="500" opacity="0.8">Interactive News indexing</text>
        </svg>
    `;
}

// Render Main Feed
function renderFeed() {
    const container = document.getElementById('news-feed-container');
    
    // 1. Filter Articles
    let filtered = [...state.currentArticles];
    
    if (state.activeCategory !== 'all') {
        filtered = filtered.filter(a => a.category === state.activeCategory);
    }
    
    if (state.searchQuery.trim() !== '') {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(a => 
            a.title.toLowerCase().includes(q) || 
            a.excerpt.toLowerCase().includes(q)
        );
    }
    
    if (state.sortOrder === 'bookmarks') {
        filtered = filtered.filter(a => state.bookmarks.includes(a.title));
    }
    
    // 2. Sort Articles
    if (state.sortOrder === 'newest') {
        // Keep defaults
    } else if (state.sortOrder === 'trending') {
        filtered.sort((a,b) => (b.title.length % 5) - (a.title.length % 5));
    }
    
    // Update Bookmark count indicator in nav
    document.getElementById('bookmark-count').innerText = state.bookmarks.length;
    
    // Render Hero (always show first matching or default)
    if (filtered.length > 0) {
        const featured = filtered[0];
        document.getElementById('hero-title').innerText = featured.title;
        document.getElementById('hero-excerpt').innerText = featured.excerpt;
        document.getElementById('hero-author').innerHTML = `<i class="fa-solid fa-user"></i> ${featured.author}`;
        document.getElementById('hero-time').innerHTML = `<i class="fa-solid fa-clock"></i> ${featured.readTime}`;
        
        // Remove click listener and re-add for featured
        const heroBtn = document.getElementById('hero-read-btn');
        const newHeroBtn = heroBtn.cloneNode(true);
        heroBtn.parentNode.replaceChild(newHeroBtn, heroBtn);
        newHeroBtn.addEventListener('click', () => handleArticleClick(featured));
    }
    
    // Render List
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; border: 1px dashed var(--border-color); border-radius: var(--border-radius); background-color: var(--card-bg);">
                <i class="fa-solid fa-folder-open" style="font-size: 32px; color: var(--text-muted); margin-bottom: 10px;"></i>
                <p style="color: var(--text-muted);">No articles indexed matching the active criteria.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map((art, idx) => {
        const isBookmarked = state.bookmarks.includes(art.title) ? 'active' : '';
        const isUpvoted = state.upvoted.includes(art.title) ? 'active' : '';
        const upvoteCount = (art.title.length % 27) + (state.upvoted.includes(art.title) ? 1 : 0);
        const premiumBadge = art.premium ? `<span class="premium-label-badge"><i class="fa-solid fa-lock"></i> Premium</span>` : '';
        
        return `
            <div class="news-card" data-index="${idx}">
                <div class="card-img-container">
                    ${getSvgPlaceholder(art.category, art.title)}
                </div>
                <div class="card-body">
                    <span class="card-cat-badge">${art.category} ${premiumBadge}</span>
                    <h3>${art.title}</h3>
                    <p>${art.excerpt}</p>
                    <div class="card-meta">
                        <div class="card-meta-left">
                            <span><i class="fa-solid fa-user"></i> ${art.author}</span>
                            <span><i class="fa-solid fa-clock"></i> ${art.readTime}</span>
                        </div>
                        <div class="engagement-bar">
                            <button class="engage-btn upvote-btn ${isUpvoted}" data-title="${art.title}">
                                <i class="fa-solid fa-thumbs-up"></i> <span>${upvoteCount}</span>
                            </button>
                            <button class="engage-btn bookmark-btn ${isBookmarked}" data-title="${art.title}">
                                <i class="fa-solid fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Bind click events to card bodies (ignoring buttons)
    container.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.engage-btn')) return;
            const index = parseInt(card.dataset.index);
            handleArticleClick(filtered[index]);
        });
    });
    
    // Bind click events to card upvote/bookmark buttons
    container.querySelectorAll('.upvote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUpvote(btn.dataset.title);
        });
    });
    
    container.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBookmark(btn.dataset.title);
        });
    });
}

// Handle Click / Navigation to an Article (performs full page reload to article.html)
function handleArticleClick(article) {
    const localIdx = localArticles.findIndex(a => a.title === article.title);
    if (localIdx > -1) {
        window.location.href = 'article.html?art_id=' + localIdx;
    } else {
        localStorage.setItem('8_med_pulse_active_rss_article', JSON.stringify(article));
        window.location.href = 'article.html?view=rss';
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    const searchEl = document.getElementById('news-search');
    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderFeed();
        });
    }
    
    // Sort select
    const sortEl = document.getElementById('news-sort');
    if (sortEl) {
        sortEl.addEventListener('change', (e) => {
            state.sortOrder = e.target.value;
            renderFeed();
        });
    }
    
    // Theme toggle
    const themeToggleEl = document.getElementById('theme-toggle');
    if (themeToggleEl) {
        themeToggleEl.addEventListener('click', toggleTheme);
    }
    
    // Detail View back button
    const backBtnEl = document.getElementById('detail-back-btn');
    if (backBtnEl) {
        backBtnEl.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    // Detail View actions
    const bookmarkBtnEl = document.getElementById('detail-bookmark-btn');
    if (bookmarkBtnEl) {
        bookmarkBtnEl.addEventListener('click', () => {
            if (state.activeArticle) {
                toggleBookmark(state.activeArticle.title);
                updateArticleActionButtons();
            }
        });
    }
    
    const upvoteBtnEl = document.getElementById('detail-upvote-btn');
    if (upvoteBtnEl) {
        upvoteBtnEl.addEventListener('click', () => {
            if (state.activeArticle) {
                toggleUpvote(state.activeArticle.title);
                updateArticleActionButtons();
            }
        });
    }
    
    // Comment Submission
    const commentFormEl = document.getElementById('detail-comment-form');
    if (commentFormEl) {
        commentFormEl.addEventListener('submit', handleCommentSubmit);
    }
    
    // Newsletter Submission
    const newsletterFormEl = document.getElementById('newsletter-form');
    if (newsletterFormEl) {
        newsletterFormEl.addEventListener('submit', handleNewsletterSubmit);
    }
    
    // Workspace calculation trigger
    const calcBtn = document.getElementById('run-calc');
    if (calcBtn) {
        calcBtn.addEventListener('click', runWorkspaceCalculator);
    }
    
    // Bookmark Nav filter link (performs page reload for bookmarks view)
    const bookmarkNavEl = document.getElementById('bookmark-nav');
    if (bookmarkNavEl) {
        bookmarkNavEl.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html?filter=bookmarks';
        });
    }
    
    // Home Nav reset link (performs full reload)
    const homeNavEl = document.querySelector('#main-nav a');
    if (homeNavEl) {
        homeNavEl.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // Brand Logo click
    const logoEl = document.getElementById('brand-logo');
    if (logoEl) {
        logoEl.style.cursor = 'pointer';
        logoEl.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // RSS Nav click
    const rssNav = document.getElementById('rss-nav');
    if (rssNav) {
        rssNav.addEventListener('click', (e) => {
            e.preventDefault();
            const widget = document.querySelector('.rss-sources-widget');
            if (widget) {
                widget.scrollIntoView({ behavior: 'smooth' });
                widget.style.outline = '2px solid var(--primary)';
                setTimeout(() => widget.style.outline = 'none', 1500);
            }
        });
    }
    
    // Ad spot clicks
    document.querySelectorAll('.ad-unit').forEach(ad => {
        ad.addEventListener('click', () => {
            alert('Simulating ad click redirection.');
            incrementAnalytics(10, 2.50);
        });
    });
    
    // RSS Loader configuration
    document.querySelectorAll('.rss-load-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            fetchRSSFeed(btn.dataset.url, btn.dataset.name, false);
        });
    });
    
    const loadCustomRssEl = document.getElementById('load-custom-rss');
    if (loadCustomRssEl) {
        loadCustomRssEl.addEventListener('click', () => {
            const urlInput = document.getElementById('custom-rss-url');
            if (urlInput && urlInput.value.trim() !== '') {
                fetchRSSFeed(urlInput.value, 'Custom RSS Resource', false);
            }
        });
    }
    
    const cancelRssBtnEl = document.getElementById('cancel-rss-btn');
    if (cancelRssBtnEl) {
        cancelRssBtnEl.addEventListener('click', () => {
            state.currentArticles = [...localArticles];
            const statusBar = document.getElementById('rss-status-bar');
            if (statusBar) statusBar.style.display = 'none';
            renderFeed();
        });
    }

    // Window scroll progress listener for reading indicator
    window.addEventListener('scroll', () => {
        const detailView = document.getElementById('article-detail-view');
        if (detailView && detailView.style.display === 'block') {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
            const bar = document.getElementById('scroll-progress-bar');
            if (bar) bar.style.width = `${scrollPercent}%`;
        }
    });
}

// Toggle Bookmarking
function toggleBookmark(title) {
    const idx = state.bookmarks.indexOf(title);
    if (idx > -1) {
        state.bookmarks.splice(idx, 1);
    } else {
        state.bookmarks.push(title);
        incrementAnalytics(1, 0.25);
    }
    saveStateToStorage();
    renderFeed();
}

// Toggle Upvote
function toggleUpvote(title) {
    const idx = state.upvoted.indexOf(title);
    if (idx > -1) {
        state.upvoted.splice(idx, 1);
    } else {
        state.upvoted.push(title);
        incrementAnalytics(1, 0.40);
    }
    saveStateToStorage();
    renderFeed();
}

// Open Article in Detail View
function openArticle(article) {
    state.activeArticle = article;
    
    // Hide Feed View, Show Detail View
    document.getElementById('feed-view').style.display = 'none';
    document.getElementById('article-detail-view').style.display = 'block';
    
    document.getElementById('detail-category').innerText = article.category;
    document.getElementById('detail-title').innerText = article.title;
    document.getElementById('detail-author').innerText = article.author;
    document.getElementById('detail-read-time').innerText = article.readTime;
    document.getElementById('detail-date').innerText = article.date;
    document.getElementById('detail-body-content').innerHTML = article.body;
    
    // Show and Reset scroll progress bar
    document.getElementById('site-scroll-progress').style.display = 'block';
    document.getElementById('scroll-progress-bar').style.width = '0%';
    
    updateArticleActionButtons();
    renderComments();
    renderRelatedArticles(article);
    
    // Reset scroll position to top of window
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    incrementAnalytics(1, 0.15); // Viewing article increases pageviews
}

// Render 7 related articles (prioritizing same category, with slide hover animations)
function renderRelatedArticles(article) {
    const listEl = document.getElementById('detail-related-list');
    if (!listEl) return;
    
    // Filter out active article
    let candidates = state.currentArticles.filter(a => a.title !== article.title);
    
    // Sort candidates: same category first
    candidates.sort((a, b) => {
        if (a.category === article.category && b.category !== article.category) return -1;
        if (a.category !== article.category && b.category === article.category) return 1;
        return 0;
    });
    
    // Pick top 7
    const related = candidates.slice(0, 7);
    
    if (related.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-muted); font-style: italic; font-size: 13px; padding: 10px 0;">No related articles found.</p>`;
        return;
    }
    
    listEl.innerHTML = related.map((art) => {
        return `
            <div class="related-article-item" style="display: flex; gap: 15px; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--border-radius); background-color: var(--card-bg); cursor: pointer; transition: all var(--transition-speed) ease; align-items: center;" data-title="${art.title}">
                <div style="flex-shrink: 0; width: 60px; height: 45px; border-radius: 4px; overflow: hidden;">
                    ${getSvgPlaceholder(art.category, art.title)}
                </div>
                <div style="flex-grow: 1;">
                    <span style="font-size: 10px; font-weight: 700; color: var(--primary); text-transform: uppercase;">${art.category}</span>
                    <h4 style="margin: 2px 0 4px 0; font-size: 14px; line-height: 1.4; color: var(--text-color); font-weight: 600;">${art.title}</h4>
                    <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 10px;">
                        <span><i class="fa-solid fa-user"></i> ${art.author}</span>
                        <span><i class="fa-solid fa-clock"></i> ${art.readTime}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Bind click handlers
    listEl.querySelectorAll('.related-article-item').forEach(item => {
        item.addEventListener('click', () => {
            const title = item.dataset.title;
            const targetArt = state.currentArticles.find(a => a.title === title);
            if (targetArt) {
                handleArticleClick(targetArt);
            }
        });
        item.addEventListener('mouseenter', () => {
            item.style.borderColor = 'var(--primary)';
            item.style.transform = 'translateX(4px)';
            item.style.backgroundColor = 'rgba(var(--primary-rgb), 0.02)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.borderColor = 'var(--border-color)';
            item.style.transform = 'translateX(0)';
            item.style.backgroundColor = 'var(--card-bg)';
        });
    });
}

// Update Article Bookmark/Upvote Buttons UI
function updateArticleActionButtons() {
    if (!state.activeArticle) return;
    
    const upBtn = document.getElementById('detail-upvote-btn');
    const bookBtn = document.getElementById('detail-bookmark-btn');
    const isUpvoted = state.upvoted.includes(state.activeArticle.title);
    const isBookmarked = state.bookmarks.includes(state.activeArticle.title);
    
    const baseCount = (state.activeArticle.title.length % 27);
    const upvoteCount = baseCount + (isUpvoted ? 1 : 0);
    
    upBtn.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> Upvoted (${upvoteCount})`;
    if (isUpvoted) upBtn.classList.add('active'); else upBtn.classList.remove('active');
    
    bookBtn.innerHTML = isBookmarked ? `<i class="fa-solid fa-bookmark"></i> Bookmarked` : `<i class="fa-solid fa-bookmark"></i> Bookmark`;
    if (isBookmarked) bookBtn.classList.add('active'); else bookBtn.classList.remove('active');
}

// Render comments for active article
function renderComments() {
    if (!state.activeArticle) return;
    const title = state.activeArticle.title;
    const comments = state.comments[title] || [];
    
    const countEl = document.getElementById('detail-comments-count');
    const listEl = document.getElementById('detail-comments-list');
    
    countEl.innerText = comments.length;
    
    if (comments.length === 0) {
        listEl.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-style:italic; font-size:13px; margin: 15px 0;">No comments yet. Start the conversation!</p>`;
        return;
    }
    
    listEl.innerHTML = comments.map(c => `
        <div class="comment-item">
            <div class="comment-meta">
                <span class="comment-author"><i class="fa-solid fa-user-circle"></i> ${c.author}</span>
                <span>${c.date}</span>
            </div>
            <div class="comment-text">${c.text}</div>
        </div>
    `).join('');
}

// Handle Comment submission
function handleCommentSubmit(e) {
    e.preventDefault();
    if (!state.activeArticle) return;
    
    const textEl = document.getElementById('detail-comment-text');
    const text = textEl.value.trim();
    if (text === '') return;
    
    const title = state.activeArticle.title;
    if (!state.comments[title]) state.comments[title] = [];
    
    state.comments[title].push({
        author: 'Guest Analyst',
        date: 'Just now',
        text: text
    });
    
    textEl.value = '';
    saveStateToStorage();
    renderComments();
    incrementAnalytics(2, 0.75);
}

// Handle Newsletter Form Subscription
function handleNewsletterSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('news-email');
    const email = emailInput.value.trim();
    if (email === '') return;
    
    const container = document.getElementById('newsletter-form-container');
    container.innerHTML = `
        <div style="text-align: center; padding: 15px; border: 1px solid var(--primary); border-radius: var(--border-radius); background-color: rgba(var(--primary-rgb), 0.05);">
            <i class="fa-solid fa-circle-check" style="font-size:28px; color: var(--primary); margin-bottom: 8px;"></i>
            <h5 style="margin:0 0 5px 0;">Subscription Confirmed</h5>
            <p style="font-size:12px; color:var(--text-muted); margin:0;">Email <strong>${email}</strong> registered for briefings.</p>
        </div>
    `;
    state.isSubscribed = true;
    saveStateToStorage();
    incrementAnalytics(15, 5.00);
}

// Run Workspace calculations
function runWorkspaceCalculator() {
    const resultEl = document.getElementById('calc-results');
    
            const symptom = document.getElementById('symptom-cat').value;
            const tier = document.getElementById('insurance-tier').value;
            
            let recom = 'Telehealth Consultation';
            let duration = 'Same Day';
            let copay = 30;
            
            if (symptom === 'cold') {
                recom = 'Telehealth Video Consult';
                copay = tier === 'gold' ? 10 : (tier === 'standard' ? 25 : 55);
            } else if (symptom === 'skin') {
                recom = 'Dermatologist Photo-Review';
                copay = tier === 'gold' ? 20 : (tier === 'standard' ? 45 : 95);
            } else if (symptom === 'joint') {
                recom = 'Physical Therapy Assessment';
                copay = tier === 'gold' ? 15 : (tier === 'standard' ? 35 : 75);
            } else {
                recom = 'Primary Care Clinic Visit';
                copay = tier === 'gold' ? 25 : (tier === 'standard' ? 50 : 120);
            }
            
            resultEl.innerHTML = `
                <div class="calc-result-box" style="border-left: 4px solid var(--primary); padding-left: 10px; margin-top: 15px;">
                    <h5 style="margin: 0 0 5px 0;">Recommended Care Plan:</h5>
                    <div style="font-weight: bold; color: var(--primary); font-size: 15px;">${recom}</div>
                    <div style="font-size: 20px; font-weight: bold; margin-top: 5px; color: var(--secondary);">$${copay} <span style="font-size: 12px; font-weight: normal; color: var(--text-color);">Estimated Copay</span></div>
                    <p style="font-size: 10px; margin: 8px 0 0 0; opacity: 0.7; font-style: italic;">*In case of severe difficulty breathing, chest pain, or trauma, seek emergency medical care immediately.</p>
                </div>
            `;
        
    incrementAnalytics(5, 1.20);
}

// Parse and Load RSS Feed via allorigins CORS proxy
function fetchRSSFeed(url, name, isAutoLoad = false) {
    const statusBar = document.getElementById('rss-status-bar');
    const sourceLabel = document.getElementById('rss-source-name');
    
    statusBar.style.display = 'flex';
    sourceLabel.innerText = name;
    statusBar.querySelector('.rss-status-message').innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Fetching active RSS feed from <strong>${name}</strong>...`;
    
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error('CORS network query failed');
            return response.text();
        })
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            const items = data.querySelectorAll("item");
            if (items.length === 0) throw new Error("No XML items parsed");
            
            const parsedArticles = [];
            items.forEach((el, idx) => {
                if (idx >= 8) return;
                
                const title = el.querySelector("title")?.textContent || "Untitled Aggregate Article";
                const link = el.querySelector("link")?.textContent || "#";
                const pubDate = el.querySelector("pubDate")?.textContent || "Recently";
                
                // Attempt to retrieve full content:encoded or full description
                let fullContent = "";
                let contentEncoded = "";
                
                // Try namespace content:encoded first (handles different XML namespaces)
                if (el.getElementsByTagNameNS) {
                    contentEncoded = el.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded")[0]?.textContent || "";
                }
                if (!contentEncoded) {
                    // Try direct selector for encoded
                    contentEncoded = el.querySelector("encoded")?.textContent || el.querySelector("content\\:encoded")?.textContent || "";
                }
                if (!contentEncoded) {
                    // Try looking in childNodes directly by name
                    const encodedNode = Array.from(el.childNodes).find(node => node.localName === "encoded" || node.nodeName === "content:encoded");
                    if (encodedNode) {
                        contentEncoded = encodedNode.textContent;
                    }
                }
                
                let rawDescription = el.querySelector("description")?.textContent || "";
                fullContent = contentEncoded || rawDescription || "No summary or content available for this feed article.";
                
                // Excerpt (always 160 chars, stripped of HTML, for list views)
                let cleanDescription = rawDescription.replace(/<[^>]*>/g, '').trim();
                if (!cleanDescription && contentEncoded) {
                    cleanDescription = contentEncoded.replace(/<[^>]*>/g, '').trim();
                }
                let excerpt = cleanDescription.substring(0, 160);
                if (cleanDescription.length > 160) excerpt += '...';
                if (!excerpt) excerpt = "No summary provided by the aggregator feed.";
                
                // Dynamically calculate read time based on word count of fullContent
                const wordCount = fullContent.replace(/<[^>]*>/g, '').split(/\\s+/).filter(w => w.length > 0).length;
                const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));
                const dynamicReadTime = `${readTimeMin} min read`;
                
                parsedArticles.push({
                    title: title,
                    excerpt: excerpt,
                    category: 'Live Feed',
                    author: name.split(' ')[0] + ' RSS',
                    date: parseDateAgo(pubDate),
                    readTime: dynamicReadTime,
                    body: `<style>
.rss-full-content {
    line-height: 1.7;
    font-size: 1.1rem;
    color: var(--text-color, #333);
}
.rss-full-content p {
    margin-bottom: 1.25rem;
}
.rss-full-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5rem 0;
}
.rss-full-content a {
    color: var(--primary);
    text-decoration: underline;
}
</style>
<div class="rss-full-content">${fullContent}</div>
<p style="margin-top:20px; font-style:italic;">This article was aggregated from an active RSS resource. You can read the original article on the publisher's site.</p>
<a href="${link}" target="_blank" class="hero-btn" style="display:inline-block; margin-top:10px;">Read Original Source <i class="fa-solid fa-external-link"></i></a>`
                });
            });
            
            state.currentArticles = parsedArticles;
            localStorage.setItem('8_med_pulse_rss_articles', JSON.stringify(parsedArticles));
            statusBar.querySelector('.rss-status-message').innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--primary);"></i> Loaded <strong>${parsedArticles.length}</strong> live articles from <strong>${name}</strong>.`;
            renderFeed();
            if (!isAutoLoad) incrementAnalytics(20, 3.50);
            
            // Auto hide status bar after 5 seconds on auto-load success
            if (isAutoLoad) {
                setTimeout(() => {
                    statusBar.style.display = 'none';
                }, 5000);
            }
        })
        .catch(err => {
            console.error(err);
            statusBar.querySelector('.rss-status-message').innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color:var(--accent);"></i> Aggregator offline. Using local simulated database.`;
            state.currentArticles = [...localArticles];
            renderFeed();
            if (isAutoLoad) {
                setTimeout(() => {
                    statusBar.style.display = 'none';
                }, 5000);
            }
        });
}

// Helper: Convert pubDate string to relative text
function parseDateAgo(dateStr) {
    try {
        const pub = new Date(dateStr);
        const diff = new Date() - pub;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours <= 0) return 'Just now';
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours/24)} days ago`;
    } catch(e) {
        return 'Recently';
    }
}

// Increment and Update ad analytics tracker
function incrementAnalytics(views, cash) {
    state.pageViews += views;
    state.earnings += cash;
    updateAnalyticsDisplay(true);
    saveStateToStorage();
}

// Update Analytics UI Display
function updateAnalyticsDisplay(animate) {
    const viewsEl = document.getElementById('analytics-pageviews');
    const earningsEl = document.getElementById('analytics-earnings');
    
    if (viewsEl && earningsEl) {
        viewsEl.innerText = state.pageViews.toLocaleString();
        earningsEl.innerText = `$${state.earnings.toFixed(2)}`;
        
        if (animate) {
            viewsEl.style.transform = 'scale(1.1)';
            earningsEl.style.transform = 'scale(1.1)';
            setTimeout(() => {
                viewsEl.style.transform = 'scale(1)';
                earningsEl.style.transform = 'scale(1)';
            }, 200);
        }
    }
}
