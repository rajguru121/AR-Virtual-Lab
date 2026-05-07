"""
VirtuLab Backend – Configuration
================================
Loads settings from .env file with sensible defaults.
"""

import os
from dotenv import load_dotenv

# Load .env from project root (one level above backend/)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


class Config:
    """Application configuration loaded from environment variables."""

    # Flask core
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-fallback-key-change-in-production')

    # JWT Authentication
    JWT_SECRET = os.getenv('JWT_SECRET', SECRET_KEY + '-jwt')
    JWT_EXPIRY_HOURS = int(os.getenv('JWT_EXPIRY_HOURS', 24))

    # Database
    DATABASE_PATH = os.getenv(
        'DATABASE_PATH',
        os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db')
    )

    # Server
    HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    PORT = int(os.getenv('FLASK_PORT', 5000))
    DEBUG = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'

    # CORS
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:8080,http://127.0.0.1:8080'
    ).split(',')
