"""
VirtuLab – Security Utilities
===============================
JWT helper re-exports and security constants.
"""

import secrets


def generate_secure_key(length: int = 64) -> str:
    """Generate a cryptographically secure random key."""
    return secrets.token_urlsafe(length)


def sanitize_input(value: str, max_length: int = 500) -> str:
    """
    Basic input sanitization:
    - Strip leading/trailing whitespace
    - Truncate to max_length
    - Remove null bytes
    """
    if not isinstance(value, str):
        return ''
    return value.strip().replace('\x00', '')[:max_length]


def is_safe_redirect_url(url: str) -> bool:
    """
    Validate that a redirect URL is relative (not an open redirect).
    Only allows paths starting with / that don't contain //.
    """
    if not url:
        return False
    return url.startswith('/') and not url.startswith('//')
