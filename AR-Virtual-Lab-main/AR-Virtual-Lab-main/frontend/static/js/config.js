/**
 * VirtuLab – Frontend Configuration
 * ===================================
 * Central place for API base URL and app-wide settings.
 * Imported by api.js and any other module that talks to the backend.
 */

const VIRTULAB_CONFIG = Object.freeze({
    // Base URL for the Flask API (no trailing slash)
    API_BASE: window.location.origin,

    // API endpoints
    ENDPOINTS: {
        SIGNUP:      '/api/signup',
        LOGIN:       '/api/login',
        EXPERIMENTS: '/api/experiments',
        PROGRESS:    '/api/progress',
        HEALTH:      '/api/health',
    },

    // Request timeout in milliseconds
    TIMEOUT_MS: 10000,

    // Local-storage keys
    STORAGE_KEYS: {
        USER:     'virtulab_user',
        TOKEN:    'virtulab_token',
        THEME:    'virtulab_theme',
        PROGRESS: 'virtulab_progress',
    },
});
