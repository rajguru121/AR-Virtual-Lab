/**
 * VirtuLab – AR Helpers (Additive Module)
 * ========================================
 * Provides utility functions for the AR simulation section:
 *   - Instruction overlay (shows on first visit)
 *   - Camera error handling with user-friendly banner
 *   - Reset button overlay for AR scene
 *   - Lazy model loading stub
 *
 * This file does NOT modify any existing AR scripts.
 * Include it AFTER the existing app.js in index.html if desired,
 * or load it standalone in AR pages.
 */

const VirtuLabAR = (() => {
    'use strict';

    // ── Instruction Overlay ──────────────────────────────────

    /**
     * Show a modal instruction overlay for AR experiments.
     * Only shows once per session (uses sessionStorage).
     * @param {object} opts – { title, steps[], onStart }
     */
    function showInstructions(opts = {}) {
        const key = 'virtulab_ar_instructions_shown';
        if (sessionStorage.getItem(key)) return;

        const {
            title = '🥽 AR Simulation',
            steps = [
                'Allow camera access when prompted by your browser.',
                'Point your camera at a flat surface (desk or table).',
                'Tap on the surface to place the 3D component.',
                'Use pinch gestures to scale, or drag to rotate.',
            ],
            onStart = null,
        } = opts;

        const overlay = document.createElement('div');
        overlay.className = 'instruction-overlay';
        overlay.innerHTML = `
            <div class="instruction-card">
                <h2>${title}</h2>
                <p>Follow these steps to get started:</p>
                ${steps.map((s, i) => `
                    <div class="step">
                        <div class="step-num">${i + 1}</div>
                        <div class="step-text">${s}</div>
                    </div>
                `).join('')}
                <button class="btn-start" id="ar-start-btn">Start Experiment →</button>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('ar-start-btn').addEventListener('click', () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                overlay.remove();
                sessionStorage.setItem(key, '1');
                if (typeof onStart === 'function') onStart();
            }, 300);
        });
    }

    // ── Camera Error Handler ─────────────────────────────────

    /**
     * Show a dismissible error banner when camera access fails.
     * @param {string} message – Error description
     */
    function showCameraError(message = 'Camera access denied or unavailable.') {
        // Remove existing banner if any
        const existing = document.querySelector('.camera-error-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.className = 'camera-error-banner';
        banner.innerHTML = `
            <span class="icon">📷</span>
            <span>${message} Please check browser permissions and try again.</span>
            <span class="dismiss" onclick="this.parentElement.remove()">✕</span>
        `;
        document.body.appendChild(banner);

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (banner.parentElement) {
                banner.style.opacity = '0';
                banner.style.transition = 'opacity 0.3s';
                setTimeout(() => banner.remove(), 300);
            }
        }, 8000);
    }

    /**
     * Wrap navigator.mediaDevices.getUserMedia with error handling.
     * @param {object} constraints – getUserMedia constraints
     * @returns {Promise<MediaStream>}
     */
    async function requestCamera(constraints = { video: { facingMode: 'environment' } }) {
        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            let msg = 'Camera access denied or unavailable.';
            if (err.name === 'NotFoundError') {
                msg = 'No camera found on this device.';
            } else if (err.name === 'NotAllowedError') {
                msg = 'Camera permission was denied.';
            } else if (err.name === 'NotReadableError') {
                msg = 'Camera is already in use by another app.';
            }
            showCameraError(msg);
            throw err;
        }
    }

    // ── Reset Button ─────────────────────────────────────────

    /**
     * Add a floating reset-button overlay to the page.
     * @param {object} opts – { onReset, onBack, showBack }
     */
    function addResetOverlay(opts = {}) {
        const {
            onReset = () => location.reload(),
            onBack = () => history.back(),
            showBack = true,
        } = opts;

        // Remove existing overlay if any
        const existing = document.querySelector('.reset-btn-overlay');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'reset-btn-overlay';

        if (showBack) {
            const backBtn = document.createElement('button');
            backBtn.innerHTML = '← Back';
            backBtn.addEventListener('click', onBack);
            container.appendChild(backBtn);
        }

        const resetBtn = document.createElement('button');
        resetBtn.className = 'danger';
        resetBtn.innerHTML = '↺ Reset';
        resetBtn.addEventListener('click', onReset);
        container.appendChild(resetBtn);

        document.body.appendChild(container);
    }

    // ── Lazy Model Loading ───────────────────────────────────

    /**
     * Lazy-load a 3D model by dynamically creating a script or
     * fetching a resource only when the AR section becomes visible.
     * @param {string} modelUrl – URL of the model/script to load
     * @returns {Promise<void>}
     */
    function lazyLoadModel(modelUrl) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${modelUrl}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = modelUrl;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load: ${modelUrl}`));
            document.body.appendChild(script);
        });
    }

    // ── Toast Helper ─────────────────────────────────────────

    /**
     * Show a brief toast notification.
     * @param {string} message
     * @param {'info'|'success'|'error'} type
     */
    function toast(message, type = 'info') {
        const el = document.createElement('div');
        el.className = `virtulab-toast ${type}`;
        el.textContent = message;
        document.body.appendChild(el);

        requestAnimationFrame(() => {
            el.classList.add('visible');
        });

        setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 400);
        }, 3000);
    }

    // ── Public API ───────────────────────────────────────────
    return Object.freeze({
        showInstructions,
        showCameraError,
        requestCamera,
        addResetOverlay,
        lazyLoadModel,
        toast,
    });
})();
