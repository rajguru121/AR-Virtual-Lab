"""
VirtuLab Backend – Auth Routes
===============================
POST /api/signup   – Register a new user
POST /api/login    – Authenticate and return user data
"""

from flask import Blueprint, request, jsonify
from backend.models import create_user, authenticate_user
from backend.services.auth_service import generate_token
from backend.utils.validators import validate_email, validate_password, validate_name

auth_bp = Blueprint('auth', __name__, url_prefix='/api')


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Register a new user account.
    Expects JSON: { name, email, password }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''

    # ── Input validation ──
    errors = []
    if not validate_name(name):
        errors.append("Name is required.")
    if not email or not validate_email(email):
        errors.append("A valid email is required.")
    pwd_errors = validate_password(password)
    if pwd_errors:
        errors.extend(pwd_errors)
    if errors:
        return jsonify({"error": " ".join(errors)}), 400

    # ── Create user ──
    try:
        user = create_user(name, email, password)
        token = generate_token(user)
        return jsonify({
            "message": "Account created successfully.",
            "user": user,
            "token": token,
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user.
    Expects JSON: { email, password }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    email = (data.get('email') or '').strip()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = authenticate_user(email, password)
    if user:
        token = generate_token(user)
        return jsonify({
            "message": "Login successful.",
            "user": user,
            "token": token,
        }), 200
    return jsonify({"error": "Invalid email or password."}), 401
