"""
VirtuLab – Rate Limiting Middleware
====================================
IP-based rate limiting to protect API endpoints from abuse.
Uses an in-memory sliding window approach.

Usage in app.py:
    from backend.middleware.rate_limiter import RateLimiter
    limiter = RateLimiter(app)
"""

import time
import threading
from functools import wraps
from flask import request, jsonify, Flask


class RateLimiter:
    """
    Simple in-memory rate limiter using a sliding window.

    Default limits:
    - Auth endpoints (/api/login, /api/signup): 5 requests per minute
    - General API endpoints: 60 requests per minute
    """

    def __init__(self, app: Flask | None = None):
        self._lock = threading.Lock()
        self._requests: dict[str, list[float]] = {}
        self._auth_limit = 5       # requests per window
        self._general_limit = 60   # requests per window
        self._window = 60          # seconds

        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask):
        """Register the rate limiter as a before_request hook."""
        app.before_request(self._check_rate_limit)

    def _get_client_ip(self) -> str:
        """Get the client IP, respecting X-Forwarded-For proxy headers."""
        forwarded = request.headers.get('X-Forwarded-For', '')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.remote_addr or '127.0.0.1'

    def _cleanup_old_requests(self, key: str, now: float):
        """Remove timestamps outside the current window."""
        if key in self._requests:
            cutoff = now - self._window
            self._requests[key] = [
                t for t in self._requests[key] if t > cutoff
            ]

    def _check_rate_limit(self):
        """
        Before-request hook that enforces rate limits.
        Only applies to /api/ routes.
        """
        path = request.path

        # Only rate-limit API endpoints
        if not path.startswith('/api/'):
            return None

        ip = self._get_client_ip()
        now = time.time()

        # Determine which limit applies
        is_auth = path in ('/api/login', '/api/signup')
        limit = self._auth_limit if is_auth else self._general_limit
        key = f"{ip}:{'auth' if is_auth else 'general'}"

        with self._lock:
            self._cleanup_old_requests(key, now)

            if key not in self._requests:
                self._requests[key] = []

            if len(self._requests[key]) >= limit:
                retry_after = int(self._window - (now - self._requests[key][0]))
                return jsonify({
                    'error': 'Too many requests. Please try again later.',
                    'retry_after': max(1, retry_after),
                }), 429

            self._requests[key].append(now)

        return None
