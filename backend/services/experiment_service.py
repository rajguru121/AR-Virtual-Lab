"""
VirtuLab – Experiment Service
==============================
Loads experiment definitions from data/experiments.json for scalability.
Falls back to the database if the JSON file is not available.
Caches results for performance.
"""

import json
import os
from backend.services.cache_service import cache

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
EXPERIMENTS_JSON = os.path.join(PROJECT_ROOT, 'data', 'experiments.json')

CACHE_KEY_EXPERIMENTS = 'experiments:all'
CACHE_KEY_CATEGORIES = 'experiments:categories'


def _load_json_file() -> dict | None:
    """Load and parse the experiments JSON file."""
    try:
        with open(EXPERIMENTS_JSON, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def get_all_experiments() -> list[dict]:
    """
    Return all experiments, preferring the JSON data source.
    Results are cached for 5 minutes.
    """
    cached = cache.get(CACHE_KEY_EXPERIMENTS)
    if cached is not None:
        return cached

    data = _load_json_file()
    if data and 'experiments' in data:
        experiments = data['experiments']
        # Map each JSON experiment to its database ID based on order (1-indexed)
        for idx, exp in enumerate(experiments):
            exp['db_id'] = idx + 1
    else:
        # Fallback: load from database (original behaviour)
        from backend.models import get_experiments
        experiments = get_experiments()
        for exp in experiments:
            exp['db_id'] = exp['id']

    cache.set(CACHE_KEY_EXPERIMENTS, experiments, ttl=300)
    return experiments


def get_categories() -> list[dict]:
    """Return experiment category definitions."""
    cached = cache.get(CACHE_KEY_CATEGORIES)
    if cached is not None:
        return cached

    data = _load_json_file()
    categories = data.get('categories', []) if data else []

    cache.set(CACHE_KEY_CATEGORIES, categories, ttl=600)
    return categories


def get_experiments_by_type(exp_type: str) -> list[dict]:
    """Filter experiments by their type (gate, combinational, sequential, cg)."""
    all_exps = get_all_experiments()
    return [e for e in all_exps if e.get('type') == exp_type]


def get_experiment_by_id(exp_id: str) -> dict | None:
    """Find a single experiment by its id field."""
    all_exps = get_all_experiments()
    for e in all_exps:
        if e.get('id') == exp_id:
            return e
    return None


def reload_experiments():
    """Force-reload experiments from disk (invalidate cache)."""
    cache.invalidate(CACHE_KEY_EXPERIMENTS)
    cache.invalidate(CACHE_KEY_CATEGORIES)
    return get_all_experiments()
