"""
VirtuLab – Cache Service
=========================
Simple in-memory caching layer with TTL support.
Used to cache expensive queries (experiments list, user progress)
so repeated requests hit memory instead of SQLite.
"""

import time
import threading


class CacheService:
    """Thread-safe in-memory cache with per-key TTL."""

    def __init__(self, default_ttl: int = 300):
        """
        Args:
            default_ttl: Default time-to-live in seconds (5 minutes).
        """
        self._store: dict = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl

    def get(self, key: str):
        """
        Retrieve a cached value by key.
        Returns None if key doesn't exist or has expired.
        """
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if time.time() > entry['expires_at']:
                del self._store[key]
                return None
            return entry['value']

    def set(self, key: str, value, ttl: int | None = None):
        """
        Store a value in the cache.
        Args:
            key: Cache key
            value: Any serializable value
            ttl: Time-to-live in seconds (uses default if not specified)
        """
        with self._lock:
            self._store[key] = {
                'value': value,
                'expires_at': time.time() + (ttl or self._default_ttl),
            }

    def invalidate(self, key: str):
        """Remove a specific key from the cache."""
        with self._lock:
            self._store.pop(key, None)

    def invalidate_prefix(self, prefix: str):
        """Remove all keys that start with the given prefix."""
        with self._lock:
            keys_to_remove = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_remove:
                del self._store[k]

    def clear(self):
        """Flush the entire cache."""
        with self._lock:
            self._store.clear()

    def stats(self) -> dict:
        """Return cache statistics."""
        with self._lock:
            now = time.time()
            total = len(self._store)
            expired = sum(1 for e in self._store.values() if now > e['expires_at'])
            return {
                'total_keys': total,
                'active_keys': total - expired,
                'expired_keys': expired,
            }


# ── Singleton instance ──────────────────────────────────────────
cache = CacheService(default_ttl=300)
