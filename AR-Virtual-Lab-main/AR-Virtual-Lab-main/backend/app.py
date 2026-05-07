"""
VirtuLab Backend – Flask Application Entry Point
==================================================
Serves the API and also acts as a static file server for the
existing frontend (main/ directory) so everything runs from one process.

Usage:
    cd AR-Virtual-Lab-main
    pip install -r requirements.txt
    python backend/app.py
"""

import os
import sys

# Ensure the project root is on sys.path so `backend.*` imports work
# regardless of where the script is invoked from.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

from backend.config import Config
from backend.models import init_db
from backend.routes.auth import auth_bp
from backend.routes.experiments import experiments_bp
from backend.middleware.rate_limiter import RateLimiter
from backend.services.experiment_service import get_all_experiments, get_categories


def create_app() -> Flask:
    """Application factory – creates and configures the Flask app."""

    app = Flask(
        __name__,
        static_folder=None  # We handle static files manually below
    )
    app.config['SECRET_KEY'] = Config.SECRET_KEY

    # ── CORS ──
    CORS(app, origins=Config.CORS_ORIGINS)

    # ── Register API blueprints ──
    app.register_blueprint(auth_bp)
    app.register_blueprint(experiments_bp)

    # ── Initialize database ──
    init_db()

    # ── Rate Limiting ──
    RateLimiter(app)

    # ── Serve the existing frontend from main/ ──
    main_dir = os.path.join(PROJECT_ROOT, 'main')
    frontend_dir = os.path.join(PROJECT_ROOT, 'frontend')

    @app.route('/')
    def serve_index():
        """Serve the original index.html from main/."""
        return send_from_directory(main_dir, 'index.html')

    @app.route('/frontend/<path:filename>')
    def serve_frontend(filename):
        """Serve new frontend assets (css/js) from frontend/."""
        return send_from_directory(frontend_dir, filename)

    @app.route('/<path:filename>')
    def serve_static(filename):
        """Serve any file from main/ (JS, CSS, HTML, gate/flip-flop pages)."""
        return send_from_directory(main_dir, filename)

    # ── Favicon ──
    @app.route('/favicon.ico')
    def favicon():
        return send_from_directory(
            main_dir, 'favicon.svg', mimetype='image/svg+xml'
        )

    # ── Health check ──
    @app.route('/api/health')
    def health():
        return {"status": "ok", "service": "VirtuLab API"}, 200

    # ── Dashboard page ──
    @app.route('/dashboard')
    def serve_dashboard():
        """Serve the new dashboard page."""
        return send_from_directory(
            os.path.join(frontend_dir, 'templates'), 'dashboard.html'
        )

    # ── Full experiments endpoint (JSON + categories) ──
    @app.route('/api/experiments/full')
    def experiments_full():
        """Return experiments and categories from JSON data source."""
        return jsonify({
            'experiments': get_all_experiments(),
            'categories': get_categories(),
        }), 200

    return app


# ── Run ───────────────────────────────────────────────────────
if __name__ == '__main__':
    import webbrowser
    import threading
    import time

    app = create_app()

    port = Config.PORT
    print()
    print('  +------------------------------------------+')
    print('  |      VirtuLab - Full-Stack Server        |')
    print('  +------------------------------------------+')
    print(f'  |   Frontend : http://localhost:{port}        |')
    print(f'  |   API      : http://localhost:{port}/api    |')
    print('  |   Press CTRL+C to stop                  |')
    print('  +------------------------------------------+')
    print()

    def open_browser():
        time.sleep(1.5)
        webbrowser.open(f'http://localhost:{port}')

    threading.Thread(target=open_browser, daemon=True).start()

    app.run(
        host=Config.HOST,
        port=port,
        debug=Config.DEBUG,
        use_reloader=False   # avoid double browser-open
    )
