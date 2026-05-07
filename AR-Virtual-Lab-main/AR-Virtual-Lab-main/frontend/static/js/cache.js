/**
 * VirtuLab – Client-Side Cache Module
 * =====================================
 * Provides localStorage-based caching with TTL for API responses.
 * Reduces redundant network requests for experiment lists, progress, etc.
 */

const VirtuLabCache = (() => {
    'use strict';

    const PREFIX = 'vlcache_';
    const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

    function set(key, data, ttl = DEFAULT_TTL) {
        try {
            const entry = {
                data,
                expires: Date.now() + ttl,
            };
            localStorage.setItem(PREFIX + key, JSON.stringify(entry));
        } catch (e) {
            // Storage full – silently fail
        }
    }

    function get(key) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            if (!raw) return null;
            const entry = JSON.parse(raw);
            if (Date.now() > entry.expires) {
                localStorage.removeItem(PREFIX + key);
                return null;
            }
            return entry.data;
        } catch {
            return null;
        }
    }

    function invalidate(key) {
        localStorage.removeItem(PREFIX + key);
    }

    function clear() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
    }

    return Object.freeze({ set, get, invalidate, clear });
})();
