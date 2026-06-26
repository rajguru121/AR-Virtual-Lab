/**
 * VirtuLab – Auth Helpers (Shared JS for login/signup)
 * =====================================================
 * Password visibility toggle, strength meter, success overlay,
 * and theme toggle for auth pages.
 * Depends on: config.js, api.js
 */

const VirtuLabAuth = (() => {
    'use strict';

    // ── Theme Toggle ─────────────────────────────────────────
    function initTheme() {
        const saved = localStorage.getItem('virtulab_theme');
        const prefer = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.body.classList.toggle('theme-dark', prefer === 'dark');

        const btn = document.getElementById('authThemeToggle');
        if (btn) {
            _updateToggleIcon(btn);
            btn.addEventListener('click', () => {
                document.body.classList.toggle('theme-dark');
                const mode = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
                localStorage.setItem('virtulab_theme', mode);
                _updateToggleIcon(btn);
            });
        }
    }

    function _updateToggleIcon(btn) {
        btn.textContent = document.body.classList.contains('theme-dark') ? '☀️' : '🌙';
    }

    // ── Password Visibility Toggle ───────────────────────────
    function initPasswordToggles() {
        document.querySelectorAll('.pass-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                if (!input) return;
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                btn.textContent = isPass ? '🙈' : '👁️';
            });
        });
    }

    // ── Password Strength Meter ──────────────────────────────
    function initStrengthMeter(inputId, meterId) {
        const input = document.getElementById(inputId);
        const meter = document.getElementById(meterId);
        if (!input || !meter) return;

        const fill = meter.querySelector('.pass-strength-fill');
        const label = meter.querySelector('.pass-strength-label');

        input.addEventListener('input', () => {
            const val = input.value;
            if (!val) {
                meter.classList.remove('visible');
                return;
            }
            meter.classList.add('visible');

            let score = 0;
            if (val.length >= 8) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            const levels = ['weak', 'weak', 'fair', 'good', 'strong'];
            const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];

            fill.className = 'pass-strength-fill ' + levels[score];
            label.textContent = labels[score];
        });
    }

    // ── Success Overlay ──────────────────────────────────────
    function showSuccess(message, redirectUrl) {
        const overlay = document.getElementById('authSuccess');
        if (overlay) {
            overlay.querySelector('.auth-success-text').textContent = message;
            overlay.classList.add('visible');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1200);
        } else {
            window.location.href = redirectUrl;
        }
    }

    // ── Button Loading State ─────────────────────────────────
    function setLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.disabled = loading;
        btn.classList.toggle('loading', loading);
    }

    return Object.freeze({
        initTheme,
        initPasswordToggles,
        initStrengthMeter,
        showSuccess,
        setLoading,
    });
})();
