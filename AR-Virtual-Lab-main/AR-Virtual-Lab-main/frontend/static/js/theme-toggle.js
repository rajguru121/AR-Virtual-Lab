/**
 * VirtuLab – Theme Toggle Module
 * ================================
 * Handles dark/light mode switching with localStorage persistence.
 * Separate file for JS code splitting.
 */

const VirtuLabTheme = (() => {
    'use strict';

    const STORAGE_KEY = 'virtulab_theme';

    function _getPreferred() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function apply(theme) {
        document.body.classList.toggle('theme-dark', theme === 'dark');
        document.body.classList.toggle('theme-light', theme === 'light');
        localStorage.setItem(STORAGE_KEY, theme);
    }

    function toggle() {
        const current = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        apply(next);
        return next;
    }

    function init() {
        apply(_getPreferred());
    }

    return Object.freeze({ init, toggle, apply });
})();
