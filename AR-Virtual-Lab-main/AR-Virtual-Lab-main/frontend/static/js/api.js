/**
 * VirtuLab – API Client
 * ======================
 * Thin wrapper around fetch() for backend communication.
 * Provides loading-indicator management and structured error handling.
 * Depends on: config.js (must be loaded first)
 */

const VirtuLabAPI = (() => {
    'use strict';

    const { API_BASE, ENDPOINTS, TIMEOUT_MS, STORAGE_KEYS } = VIRTULAB_CONFIG;

    // ── Loading indicator ────────────────────────────────────
    let _activeRequests = 0;

    function _showLoading() {
        _activeRequests++;
        let el = document.getElementById('virtulab-loading');
        if (!el) {
            el = document.createElement('div');
            el.id = 'virtulab-loading';
            el.innerHTML = `
                <div style="
                    position:fixed; top:0; left:0; width:100%; height:3px;
                    z-index:99999; pointer-events:none;
                ">
                    <div style="
                        height:100%; width:30%;
                        background:linear-gradient(90deg,#00e5ff,#7c3aed,#10b981);
                        animation:virtulab-bar 1.2s ease-in-out infinite;
                        border-radius:0 2px 2px 0;
                    "></div>
                </div>
            `;
            // Inject keyframes once
            if (!document.getElementById('virtulab-loading-style')) {
                const style = document.createElement('style');
                style.id = 'virtulab-loading-style';
                style.textContent = `
                    @keyframes virtulab-bar {
                        0%   { margin-left:-30%; }
                        100% { margin-left:100%; }
                    }
                `;
                document.head.appendChild(style);
            }
            document.body.appendChild(el);
        }
        el.style.display = 'block';
    }

    function _hideLoading() {
        _activeRequests = Math.max(0, _activeRequests - 1);
        if (_activeRequests === 0) {
            const el = document.getElementById('virtulab-loading');
            if (el) el.style.display = 'none';
        }
    }

    // ── Core request helper ──────────────────────────────────

    /**
     * Make an API request.
     * @param {string} endpoint  – one of ENDPOINTS values
     * @param {object} options   – { method, body, params }
     * @returns {Promise<object>} parsed JSON response
     */
    async function _request(endpoint, { method = 'GET', body = null, params = '' } = {}) {
        const url = `${API_BASE}${endpoint}${params}`;
        const headers = { 'Content-Type': 'application/json' };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        _showLoading();

        try {
            const resp = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
                signal: controller.signal,
            });

            const data = await resp.json();

            if (!resp.ok) {
                throw new Error(data.error || `Request failed (${resp.status})`);
            }

            return data;
        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw err;
        } finally {
            clearTimeout(timer);
            _hideLoading();
        }
    }

    // ── Public API methods ───────────────────────────────────

    /** Register a new user */
    async function signup(name, email, password) {
        const data = await _request(ENDPOINTS.SIGNUP, {
            method: 'POST',
            body: { name, email, password },
        });
        if (data.user) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        }
        if (data.token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        }
        return data;
    }

    /** Log in an existing user */
    async function login(email, password) {
        const data = await _request(ENDPOINTS.LOGIN, {
            method: 'POST',
            body: { email, password },
        });
        if (data.user) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        }
        if (data.token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        }
        return data;
    }

    /** Log out (client-side only) */
    function logout() {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }

    /** Get the currently stored user or null */
    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
        } catch {
            return null;
        }
    }

    /** Fetch all experiments */
    async function getExperiments() {
        return _request(ENDPOINTS.EXPERIMENTS);
    }

    /** Save experiment progress */
    async function saveProgress(userId, experimentId, status, score) {
        return _request(ENDPOINTS.PROGRESS, {
            method: 'POST',
            body: {
                user_id: userId,
                experiment_id: experimentId,
                status,
                score,
            },
        });
    }

    /** Fetch progress for a specific user */
    async function getProgress(userId) {
        return _request(ENDPOINTS.PROGRESS, {
            params: `/${userId}`,
        });
    }

    /** Health check */
    async function healthCheck() {
        return _request(ENDPOINTS.HEALTH);
    }

    // ── Expose public interface ──────────────────────────────
    return Object.freeze({
        signup,
        login,
        logout,
        getCurrentUser,
        getExperiments,
        saveProgress,
        getProgress,
        healthCheck,
    });
})();
