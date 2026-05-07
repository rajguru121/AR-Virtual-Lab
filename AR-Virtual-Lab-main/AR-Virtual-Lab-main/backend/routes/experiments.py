"""
VirtuLab Backend – Experiment Routes
=====================================
GET  /api/experiments          – List all experiments
POST /api/progress             – Save / update progress  (auth required)
GET  /api/progress/<user_id>   – Get progress for a user (auth required)
"""

from flask import Blueprint, request, jsonify, g
from backend.models import get_experiments, upsert_progress, get_user_progress
from backend.services.auth_service import jwt_required

experiments_bp = Blueprint('experiments', __name__, url_prefix='/api')


@experiments_bp.route('/experiments', methods=['GET'])
def list_experiments():
    """Return all available experiments."""
    experiments = get_experiments()
    return jsonify({"experiments": experiments}), 200


@experiments_bp.route('/progress', methods=['POST'])
@jwt_required
def save_progress():
    """
    Save or update experiment progress.
    Expects JSON: { experiment_id, status, score }
    User ID is taken from the authenticated JWT token.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    # Use authenticated user's ID from JWT token
    user_id = g.current_user['user_id']
    experiment_id = data.get('experiment_id')
    status = (data.get('status') or '').strip()
    score = data.get('score', 0)

    # ── Validation ──
    errors = []
    if not experiment_id or not isinstance(experiment_id, int):
        errors.append("Valid experiment_id (integer) is required.")
    if status not in ('not_started', 'in_progress', 'completed'):
        errors.append("Status must be one of: not_started, in_progress, completed.")
    if not isinstance(score, int) or score < 0:
        errors.append("Score must be a non-negative integer.")
    if errors:
        return jsonify({"error": " ".join(errors)}), 400

    progress = upsert_progress(user_id, experiment_id, status, score)
    return jsonify({"message": "Progress saved.", "progress": progress}), 200


@experiments_bp.route('/progress/<int:user_id>', methods=['GET'])
@jwt_required
def get_progress(user_id):
    """Return all progress records for a given user. Users can only view their own."""
    # Users can only access their own progress
    if g.current_user['user_id'] != user_id:
        return jsonify({"error": "Access denied."}), 403
    progress = get_user_progress(user_id)
    return jsonify({"progress": progress}), 200
