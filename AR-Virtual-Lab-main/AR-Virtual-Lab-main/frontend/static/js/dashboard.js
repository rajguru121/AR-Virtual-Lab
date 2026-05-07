/**
 * VirtuLab – Dashboard Controller
 * =================================
 * Handles experiment card rendering, filtering, search,
 * lazy loading, and progress tracking on the dashboard page.
 * Depends on: config.js, api.js, cache.js, theme-toggle.js
 */

const VirtuLabDashboard = (() => {
    'use strict';

    let _experiments = [];
    let _categories = [];
    let _activeFilter = 'all';
    let _searchQuery = '';

    // ── Initialization ───────────────────────────────────────

    async function init() {
        VirtuLabTheme.init();
        _bindEvents();
        _renderSkeletons(8);
        await _loadData();
        _renderStats();
        _renderFilters();
        _renderCards();
        _hideLoader();
        _updateUserInfo();
    }

    // ── Data Loading (with client cache) ─────────────────────

    async function _loadData() {
        // Try client cache first
        const cached = VirtuLabCache.get('experiments_full');
        if (cached) {
            _experiments = cached.experiments || [];
            _categories = cached.categories || [];
            return;
        }

        try {
            const resp = await fetch('/api/experiments/full');
            if (!resp.ok) throw new Error('Failed to load');
            const data = await resp.json();
            _experiments = data.experiments || [];
            _categories = data.categories || [];
            VirtuLabCache.set('experiments_full', data, 5 * 60 * 1000);
        } catch {
            // Fallback: try basic endpoint
            try {
                const resp = await fetch('/api/experiments');
                if (resp.ok) {
                    const data = await resp.json();
                    _experiments = data.experiments || [];
                }
            } catch { /* offline */ }
        }
    }

    // ── Rendering ────────────────────────────────────────────

    function _renderSkeletons(count) {
        const grid = document.getElementById('dashCards');
        if (!grid) return;
        grid.innerHTML = Array.from({ length: count }, () => `
            <div class="dash-skeleton">
                <div class="dash-skeleton-bar icon"></div>
                <div class="dash-skeleton-bar medium"></div>
                <div class="dash-skeleton-bar short"></div>
                <div class="dash-skeleton-bar"></div>
            </div>
        `).join('');
    }

    function _renderCards() {
        const grid = document.getElementById('dashCards');
        if (!grid) return;

        let filtered = _experiments;

        if (_activeFilter !== 'all') {
            filtered = filtered.filter(e => e.type === _activeFilter);
        }

        if (_searchQuery) {
            const q = _searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                (e.title || '').toLowerCase().includes(q) ||
                (e.description || '').toLowerCase().includes(q) ||
                (e.tags || []).some(t => t.includes(q))
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="dash-empty" style="grid-column:1/-1">
                    <div class="dash-empty-icon">🔍</div>
                    <h3>No experiments found</h3>
                    <p>Try a different filter or search term.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(exp => {
            const url = exp.url || '#';
            const diff = exp.difficulty || 'beginner';
            const duration = exp.duration_minutes || 15;
            const tags = (exp.tags || []).slice(0, 3);

            return `
                <a class="dash-card" href="${url}" data-id="${exp.id}" id="card-${exp.id}">
                    <div class="dash-card-header">
                        <div class="dash-card-icon">${exp.icon || '⚡'}</div>
                        <span class="dash-card-badge ${diff}">${diff}</span>
                    </div>
                    <div class="dash-card-title">${exp.title}</div>
                    <div class="dash-card-desc">${exp.description || ''}</div>
                    <div class="dash-card-meta">
                        <span>⏱ ${duration} min</span>
                        <span>📁 ${exp.category || exp.type}</span>
                    </div>
                    ${tags.length ? `<div class="dash-card-tags">${tags.map(t => `<span class="dash-card-tag">${t}</span>`).join('')}</div>` : ''}
                </a>
            `;
        }).join('');
    }

    function _renderFilters() {
        const container = document.getElementById('dashFilters');
        if (!container) return;

        const types = [
            { id: 'all', name: 'All Experiments', icon: '🧪' },
            ..._categories.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
        ];

        // Fallback if no categories loaded
        if (_categories.length === 0) {
            const uniqueTypes = [...new Set(_experiments.map(e => e.type))];
            uniqueTypes.forEach(t => {
                types.push({ id: t, name: t.charAt(0).toUpperCase() + t.slice(1), icon: '📂' });
            });
        }

        container.innerHTML = types.map(t => `
            <button class="dash-filter-btn ${t.id === _activeFilter ? 'active' : ''}"
                    data-filter="${t.id}" id="filter-${t.id}">
                ${t.icon} ${t.name}
            </button>
        `).join('');
    }

    function _renderStats() {
        const total = _experiments.length;
        const gates = _experiments.filter(e => e.type === 'gate').length;
        const circuits = _experiments.filter(e => ['combinational', 'sequential'].includes(e.type)).length;
        const graphics = _experiments.filter(e => e.type === 'cg').length;

        _setStatValue('statTotal', total);
        _setStatValue('statGates', gates);
        _setStatValue('statCircuits', circuits);
        _setStatValue('statGraphics', graphics);
    }

    function _setStatValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function _updateUserInfo() {
        try {
            const user = JSON.parse(localStorage.getItem('virtulab_user'));
            if (user) {
                const nameEl = document.getElementById('userName');
                const emailEl = document.getElementById('userEmail');
                const avatarEl = document.getElementById('userAvatar');
                const welcomeEl = document.getElementById('welcomeName');
                if (nameEl) nameEl.textContent = user.name;
                if (emailEl) emailEl.textContent = user.email;
                if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
                if (welcomeEl) welcomeEl.textContent = user.name.split(' ')[0];
            }
        } catch { /* no user */ }
    }

    function _hideLoader() {
        const loader = document.getElementById('dashLoader');
        if (loader) {
            setTimeout(() => loader.classList.add('hidden'), 400);
        }
    }

    // ── Event Binding ────────────────────────────────────────

    function _bindEvents() {
        // Filter clicks (delegated)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.dash-filter-btn');
            if (btn) {
                _activeFilter = btn.dataset.filter;
                document.querySelectorAll('.dash-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                _renderCards();
            }
        });

        // Search input
        const searchInput = document.getElementById('dashSearch');
        if (searchInput) {
            let debounce;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    _searchQuery = e.target.value.trim();
                    _renderCards();
                }, 250);
            });
        }

        // Theme toggle
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => VirtuLabTheme.toggle());
        }

        // Mobile menu toggle
        const menuBtn = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.dash-sidebar');
        if (menuBtn && sidebar) {
            menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('open') &&
                    !sidebar.contains(e.target) &&
                    e.target !== menuBtn) {
                    sidebar.classList.remove('open');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('virtulab_user');
                localStorage.removeItem('virtulab_token');
                VirtuLabCache.clear();
                window.location.href = '/frontend/templates/login.html';
            });
        }
    }

    return Object.freeze({ init });
})();

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => VirtuLabDashboard.init());
