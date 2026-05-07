"""
VirtuLab – Input Validators
=============================
Reusable validation helpers for request data.
Extracted from route handlers for cleaner separation.
"""

import re

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')


def validate_email(email: str) -> bool:
    """Check if the email address has a valid format."""
    return bool(EMAIL_RE.match(email))


def validate_password(password: str, min_length: int = 8) -> list[str]:
    """
    Validate password strength. Returns a list of error messages.
    Empty list means the password is valid.
    """
    errors = []
    if len(password) < min_length:
        errors.append(f"Password must be at least {min_length} characters.")
    if not re.search(r'[A-Z]', password):
        errors.append("Password should contain at least one uppercase letter.")
    if not re.search(r'[a-z]', password):
        errors.append("Password should contain at least one lowercase letter.")
    if not re.search(r'[0-9]', password):
        errors.append("Password should contain at least one digit.")
    return errors


def validate_name(name: str) -> bool:
    """Check that a name is non-empty and reasonable length."""
    return bool(name) and 1 <= len(name) <= 200


def validate_score(score) -> bool:
    """Score must be a non-negative integer."""
    return isinstance(score, int) and score >= 0


def validate_status(status: str) -> bool:
    """Status must be one of the allowed values."""
    return status in ('not_started', 'in_progress', 'completed')
