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
    
    // User-specific progress and stats
    let _userProgressList = [];
    let _userStats = {
        progress: 0,
        completed_experiments: 0,
        saved_experiments: 0,
        stat_total: 0,
        stat_gates: 0,
        stat_circuits: 0,
        stat_graphics: 0
    };

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

    // ── Data Loading (with client cache and API integration) ─

    async function _loadData() {
        // Try client cache first for experiments JSON
        const cached = VirtuLabCache.get('experiments_full');
        if (cached) {
            _experiments = cached.experiments || [];
            _categories = cached.categories || [];
        } else {
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

        // Fetch user-specific progress and stats from backend APIs
        const user = VirtuLabAPI.getCurrentUser();
        if (user && user.id) {
            try {
                // 1. Fetch detailed progress records (to know which are saved/completed)
                const progressData = await VirtuLabAPI.getProgress(user.id);
                _userProgressList = progressData.progress || [];

                // 2. Fetch dashboard statistics
                const statsData = await VirtuLabAPI.getDashboardStats();
                if (statsData) {
                    _userStats = statsData;
                }
            } catch (e) {
                console.warn('Could not load user-specific stats', e);
            }
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

            // Find if this experiment has user progress/saved status
            const progressRecord = _userProgressList.find(p => p.experiment_id === exp.db_id);
            const isCompleted = progressRecord && progressRecord.status === 'completed';
            const isSaved = progressRecord && progressRecord.saved === 1;

            return `
                <div class="dash-card" id="card-${exp.id}" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; position: relative;">
                    <div>
                        <div class="dash-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="dash-card-icon">${exp.icon || '⚡'}</div>
                            <div style="display: flex; gap: 0.4rem; align-items: center;">
                                <button class="dash-save-btn" data-dbid="${exp.db_id}" aria-label="Save experiment" 
                                        style="background: none; border: none; font-size: 1.25rem; cursor: pointer; padding: 0; line-height: 1; transition: transform 0.1s ease;">
                                    ${isSaved ? '⭐' : '☆'}
                                </button>
                                <span class="dash-card-badge ${diff}">${diff}</span>
                            </div>
                        </div>
                        <div class="dash-card-title" style="margin-top: 0.75rem;">${exp.title}</div>
                        <div class="dash-card-desc">${exp.description || ''}</div>
                    </div>
                    <div>
                        <div class="dash-card-meta" style="margin-top: 0.75rem;">
                            <span>⏱ ${duration} min</span>
                            <span>📁 ${exp.category || exp.type}</span>
                        </div>
                        ${tags.length ? `<div class="dash-card-tags" style="margin-top: 0.5rem;">${tags.map(t => `<span class="dash-card-tag">${t}</span>`).join('')}</div>` : ''}
                        
                        <div class="dash-card-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; border-top: 1px solid var(--dash-border); padding-top: 0.75rem;">
                            <a class="dash-launch-btn" href="${url}" target="_blank"
                               style="text-decoration: none; padding: 0.45rem 0.9rem; background: var(--dash-accent); color: white; border-radius: 8px; font-size: 0.78rem; font-weight: 600; text-align: center; flex-grow: 1; transition: opacity 0.2s;">
                                Launch 🚀
                            </a>
                            <button class="dash-complete-btn ${isCompleted ? 'completed' : ''}" data-dbid="${exp.db_id}" data-status="${isCompleted ? 'completed' : 'not_completed'}"
                                    style="padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid ${isCompleted ? '#10b981' : 'var(--dash-border)'}; background: ${isCompleted ? 'rgba(16,185,129,0.1)' : 'var(--dash-surface)'}; color: ${isCompleted ? '#10b981' : 'var(--dash-text-secondary)'};">
                                ${isCompleted ? 'Completed ✓' : 'Complete'}
                            </button>
                        </div>
                    </div>
                </div>
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
        _setStatValue('statProgress', (_userStats.progress || 0) + '%');
        _setStatValue('statCompleted', _userStats.completed_experiments || 0);
        _setStatValue('statSaved', _userStats.saved_experiments || 0);
        _setStatValue('statTotal', _userStats.stat_total || 0);
        _setStatValue('statGates', _userStats.stat_gates || 0);
        _setStatValue('statCircuits', _userStats.stat_circuits || 0);
        _setStatValue('statGraphics', _userStats.stat_graphics || 0);
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
                VirtuLabAPI.logout();
                VirtuLabCache.clear();
                window.location.href = '/frontend/templates/login.html';
            });
        }

        // Save (star) button click (delegated)
        document.addEventListener('click', async (e) => {
            const saveBtn = e.target.closest('.dash-save-btn');
            if (!saveBtn) return;

            const dbId = parseInt(saveBtn.dataset.dbid, 10);
            if (isNaN(dbId)) return;

            // Optimistic UI update
            saveBtn.style.transform = 'scale(1.2)';
            setTimeout(() => saveBtn.style.transform = 'scale(1)', 100);

            try {
                const res = await VirtuLabAPI.toggleSaveExperiment(dbId);
                if (res && res.stats) {
                    _userStats = res.stats;
                    
                    // Update our progress list local item
                    const idx = _userProgressList.findIndex(p => p.experiment_id === dbId);
                    if (idx > -1) {
                        _userProgressList[idx] = res.progress;
                    } else {
                        _userProgressList.push(res.progress);
                    }
                    
                    _renderStats();
                    _renderCards();
                }
            } catch (err) {
                console.error('Failed to toggle save status', err);
            }
        });

        // Complete button click (delegated)
        document.addEventListener('click', async (e) => {
            const completeBtn = e.target.closest('.dash-complete-btn');
            if (!completeBtn) return;

            const dbId = parseInt(completeBtn.dataset.dbid, 10);
            if (isNaN(dbId)) return;

            const user = VirtuLabAPI.getCurrentUser();
            if (!user) return;

            const currentStatus = completeBtn.dataset.status;
            const newStatus = (currentStatus === 'completed') ? 'not_started' : 'completed';

            // Optimistic styling toggle
            completeBtn.disabled = true;
            completeBtn.style.opacity = '0.7';

            try {
                const res = await VirtuLabAPI.saveProgress(user.id, dbId, newStatus, 100);
                if (res && res.stats) {
                    _userStats = res.stats;
                    
                    // Update our progress list local item
                    const idx = _userProgressList.findIndex(p => p.experiment_id === dbId);
                    if (idx > -1) {
                        _userProgressList[idx] = res.progress;
                    } else {
                        _userProgressList.push(res.progress);
                    }

                    _renderStats();
                    _renderCards();
                }
            } catch (err) {
                console.error('Failed to save progress status', err);
                completeBtn.disabled = false;
                completeBtn.style.opacity = '1';
            }
        });
    }

    return Object.freeze({ init });
})();

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => VirtuLabDashboard.init());
