"""
VirtuLab – JWT Authentication Service
=======================================
Handles token generation, validation, and user session management.
Passwords are already hashed via Werkzeug in models.py – this module
adds stateless JWT-based auth on top.
"""

import jwt
import datetime
from functools import wraps
from flask import request, jsonify, g
from backend.config import Config


def generate_token(user: dict) -> str:
    """
    Generate a JWT token for an authenticated user.
    Payload includes user id, email, and expiry time.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        'user_id': user['id'],
        'email': user['email'],
        'name': user.get('name', ''),
        'iat': now,
        'exp': now + datetime.timedelta(
            hours=Config.JWT_EXPIRY_HOURS
        ),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')


def decode_token(token: str) -> dict | None:
    """
    Decode and validate a JWT token.
    Returns the payload dict or None if invalid/expired.
    """
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def jwt_required(f):
    """
    Decorator for routes that require a valid JWT token.
    Token should be passed in the Authorization header as:
        Authorization: Bearer <token>

    On success, sets g.current_user with the token payload.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header.'}), 401

        token = auth_header.split(' ', 1)[1]
        payload = decode_token(token)

        if payload is None:
            return jsonify({'error': 'Token is invalid or expired.'}), 401

        g.current_user = payload
        return f(*args, **kwargs)

    return decorated
