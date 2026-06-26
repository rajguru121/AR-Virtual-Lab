"""
VirtuLab Backend – Experiment Routes
=====================================
GET  /api/experiments          – List all experiments
POST /api/progress             – Save / update progress  (auth required)
GET  /api/progress/<user_id>   – Get progress for a user (auth required)
"""

from flask import Blueprint, request, jsonify, g
from backend.models import (
    get_experiments, upsert_progress, get_user_progress,
    get_user_dashboard_stats, toggle_saved_experiment,
    get_user_badges, save_user_badges,
    get_user_analytics, save_user_analytics,
    get_circuit_design, save_circuit_design
)
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
    stats = get_user_dashboard_stats(user_id)
    return jsonify({
        "message": "Progress saved.",
        "progress": progress,
        "stats": stats
    }), 200


@experiments_bp.route('/progress/<int:user_id>', methods=['GET'])
@jwt_required
def get_progress(user_id):
    """Return all progress records for a given user. Users can only view their own."""
    # Users can only access their own progress
    if g.current_user['user_id'] != user_id:
        return jsonify({"error": "Access denied."}), 403
    progress = get_user_progress(user_id)
    return jsonify({"progress": progress}), 200


@experiments_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required
def get_dashboard_stats():
    """Return dashboard statistics for the authenticated user."""
    user_id = g.current_user['user_id']
    stats = get_user_dashboard_stats(user_id)
    return jsonify(stats), 200


@experiments_bp.route('/experiments/toggle-save', methods=['POST'])
@jwt_required
def toggle_save():
    """Toggle the saved status of an experiment."""
    data = request.get_json(silent=True)
    if not data or 'experiment_id' not in data:
        return jsonify({"error": "experiment_id is required."}), 400
        
    user_id = g.current_user['user_id']
    experiment_id = data['experiment_id']
    
    if not isinstance(experiment_id, int):
        return jsonify({"error": "experiment_id must be an integer."}), 400
        
    progress = toggle_saved_experiment(user_id, experiment_id)
    stats = get_user_dashboard_stats(user_id)
    return jsonify({
        "message": "Saved status toggled.",
        "progress": progress,
        "stats": stats
    }), 200


@experiments_bp.route('/user/sync', methods=['GET'])
@jwt_required
def get_user_sync_data():
    """Retrieve all saved state for the authenticated user."""
    user_id = g.current_user['user_id']
    progress = get_user_progress(user_id)
    badges = get_user_badges(user_id)
    analytics = get_user_analytics(user_id)
    circuit = get_circuit_design(user_id)
    stats = get_user_dashboard_stats(user_id)
    
    return jsonify({
        "progress": progress,
        "badges": badges,
        "analytics": analytics,
        "circuit": circuit,
        "stats": stats
    }), 200


@experiments_bp.route('/user/sync', methods=['POST'])
@jwt_required
def save_user_sync_data():
    """Synchronize user progress, badges, and analytics."""
    user_id = g.current_user['user_id']
    data = request.get_json(silent=True) or {}
    
    # Save progress records if passed
    progress_records = data.get('progress', [])
    if isinstance(progress_records, list):
        for rec in progress_records:
            exp_id = rec.get('experiment_id')
            status = rec.get('status')
            score = rec.get('score', 0)
            if exp_id and status:
                upsert_progress(user_id, exp_id, status, score)
                
    # Save badges if passed
    badges = data.get('badges')
    if isinstance(badges, list):
        save_user_badges(user_id, badges)
        
    # Save analytics if passed
    analytics = data.get('analytics')
    if isinstance(analytics, dict):
        save_user_analytics(user_id, analytics)
        
    # If circuit design is passed, save it
    circuit = data.get('circuit')
    if circuit is not None:
        save_circuit_design(user_id, str(circuit))
        
    # Return updated state
    updated_progress = get_user_progress(user_id)
    updated_badges = get_user_badges(user_id)
    updated_analytics = get_user_analytics(user_id)
    updated_circuit = get_circuit_design(user_id)
    updated_stats = get_user_dashboard_stats(user_id)
    
    return jsonify({
        "message": "User data synced successfully.",
        "progress": updated_progress,
        "badges": updated_badges,
        "analytics": updated_analytics,
        "circuit": updated_circuit,
        "stats": updated_stats
    }), 200


@experiments_bp.route('/user/circuit', methods=['GET'])
@jwt_required
def get_user_circuit():
    """Retrieve saved circuit design for the authenticated user."""
    user_id = g.current_user['user_id']
    design = get_circuit_design(user_id)
    return jsonify({"circuit": design}), 200


@experiments_bp.route('/user/circuit', methods=['POST'])
@jwt_required
def save_user_circuit():
    """Save circuit design for the authenticated user."""
    user_id = g.current_user['user_id']
    data = request.get_json(silent=True) or {}
    design = data.get('circuit')
    
    if design is None:
        return jsonify({"error": "circuit parameter is required."}), 400
        
    save_circuit_design(user_id, str(design))
    return jsonify({"message": "Circuit design saved successfully."}), 200

