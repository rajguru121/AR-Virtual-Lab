"""
VirtuLab Backend – Database Models
===================================
SQLite helper functions and schema management.
All DB access goes through these functions to keep routes clean.
"""

import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from backend.config import Config


def _get_db_path():
    """Resolve the absolute path to the SQLite database file."""
    path = os.path.abspath(Config.DATABASE_PATH)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def get_connection():
    """Return a new SQLite connection with row-factory enabled."""
    conn = sqlite3.connect(_get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't already exist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS User (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            roll_number TEXT    NOT NULL UNIQUE,
            email       TEXT    NOT NULL UNIQUE,
            password    TEXT    NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Experiment (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            title   TEXT    NOT NULL,
            type    TEXT    NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Progress (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            experiment_id   INTEGER NOT NULL,
            status          TEXT    NOT NULL DEFAULT 'not_started',
            score           INTEGER DEFAULT 0,
            saved           INTEGER DEFAULT 0,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)       REFERENCES User(id),
            FOREIGN KEY (experiment_id) REFERENCES Experiment(id),
            UNIQUE(user_id, experiment_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS UserBadge (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            badge_name  TEXT NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(id),
            UNIQUE(user_id, badge_name)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS UserAnalytics (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL UNIQUE,
            cpp_downloads   INTEGER DEFAULT 0,
            lab_time        INTEGER DEFAULT 0,
            weekly_activity TEXT DEFAULT '0,0,0,0,0,0,0',
            recent_activity TEXT DEFAULT '[]',
            FOREIGN KEY (user_id) REFERENCES User(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS CircuitDesign (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL UNIQUE,
            design_json TEXT NOT NULL,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(id)
        )
    """)

    # Try to alter existing table to add the saved column if it doesn't exist yet
    try:
        cursor.execute("ALTER TABLE Progress ADD COLUMN saved INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    # Seed default experiments if table is empty
    if cursor.execute("SELECT COUNT(*) FROM Experiment").fetchone()[0] == 0:
        experiments = [
            ("AND Gate", "gate"),
            ("OR Gate", "gate"),
            ("NOT Gate", "gate"),
            ("NAND Gate", "gate"),
            ("NOR Gate", "gate"),
            ("XOR Gate", "gate"),
            ("XNOR Gate", "gate"),
            ("BUFFER Gate", "gate"),
            ("Half Adder", "combinational"),
            ("Full Adder", "combinational"),
            ("MUX 4:1", "combinational"),
            ("2:4 Decoder", "combinational"),
            ("4:2 Encoder", "combinational"),
            ("SR Flip-Flop", "sequential"),
            ("JK Flip-Flop", "sequential"),
            ("D Flip-Flop", "sequential"),
            ("T Flip-Flop", "sequential"),
            ("DDA Line", "cg"),
            ("Bresenham Line", "cg"),
            ("Circle Drawing", "cg"),
            ("2D Transforms", "cg"),
            ("3D Transforms", "cg"),
            ("Clipping", "cg"),
            ("Bezier Curves", "cg"),
        ]
        cursor.executemany(
            "INSERT INTO Experiment (title, type) VALUES (?, ?)",
            experiments
        )

    conn.commit()
    conn.close()


# ── User helpers ──────────────────────────────────────────────

def create_user(name: str, roll_number: str, email: str, password: str) -> dict:
    """
    Insert a new user. Returns the user dict or raises ValueError
    if the email or roll number already exists.
    """
    import bcrypt
    conn = get_connection()
    try:
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        conn.execute(
            "INSERT INTO User (name, roll_number, email, password) VALUES (?, ?, ?, ?)",
            (name, roll_number.strip(), email.lower().strip(), hashed_password)
        )
        conn.commit()
        user = conn.execute(
            "SELECT id, name, roll_number, email FROM User WHERE email = ?",
            (email.lower().strip(),)
        ).fetchone()
        return dict(user)
    except sqlite3.IntegrityError:
        raise ValueError("A user with this email or roll number already exists.")
    finally:
        conn.close()


def authenticate_user(email_or_roll: str, password: str) -> dict | None:
    """
    Verify credentials. Returns user dict on success, None on failure.
    """
    import bcrypt
    conn = get_connection()
    user = conn.execute(
        "SELECT * FROM User WHERE email = ? OR roll_number = ?",
        (email_or_roll.lower().strip(), email_or_roll.strip())
    ).fetchone()
    conn.close()

    if user:
        try:
            is_valid = bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8'))
        except Exception:
            is_valid = False
        if is_valid:
            return {
                "id": user['id'],
                "name": user['name'],
                "roll_number": user['roll_number'],
                "email": user['email']
            }
    return None


# ── Experiment helpers ────────────────────────────────────────

def get_experiments() -> list[dict]:
    """Return all experiments."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM Experiment ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Progress helpers ──────────────────────────────────────────

def upsert_progress(user_id: int, experiment_id: int, status: str, score: int) -> dict:
    """Insert or update a progress record (upsert on user+experiment)."""
    conn = get_connection()
    conn.execute("""
        INSERT INTO Progress (user_id, experiment_id, status, score, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, experiment_id) DO UPDATE SET
            status     = excluded.status,
            score      = excluded.score,
            updated_at = CURRENT_TIMESTAMP
    """, (user_id, experiment_id, status, score))
    conn.commit()

    row = conn.execute("""
        SELECT p.*, e.title as experiment_title
        FROM Progress p
        JOIN Experiment e ON e.id = p.experiment_id
        WHERE p.user_id = ? AND p.experiment_id = ?
    """, (user_id, experiment_id)).fetchone()
    conn.close()
    return dict(row)


def get_user_progress(user_id: int) -> list[dict]:
    """Return all progress records for a given user."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT p.*, e.title as experiment_title, e.type as experiment_type
        FROM Progress p
        JOIN Experiment e ON e.id = p.experiment_id
        WHERE p.user_id = ?
        ORDER BY p.updated_at DESC
    """, (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def toggle_saved_experiment(user_id: int, experiment_id: int) -> dict:
    """Toggle the saved status of an experiment for a user."""
    conn = get_connection()
    row = conn.execute(
        "SELECT saved FROM Progress WHERE user_id = ? AND experiment_id = ?",
        (user_id, experiment_id)
    ).fetchone()
    
    new_saved = 1
    if row:
        new_saved = 0 if row['saved'] == 1 else 1
        conn.execute("""
            UPDATE Progress 
            SET saved = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND experiment_id = ?
        """, (new_saved, user_id, experiment_id))
    else:
        conn.execute("""
            INSERT INTO Progress (user_id, experiment_id, status, score, saved, updated_at)
            VALUES (?, ?, 'not_started', 0, 1, CURRENT_TIMESTAMP)
        """, (user_id, experiment_id))
    
    conn.commit()
    
    updated_row = conn.execute("""
        SELECT p.*, e.title as experiment_title
        FROM Progress p
        JOIN Experiment e ON e.id = p.experiment_id
        WHERE p.user_id = ? AND p.experiment_id = ?
    """, (user_id, experiment_id)).fetchone()
    conn.close()
    return dict(updated_row)


def get_user_dashboard_stats(user_id: int) -> dict:
    """Retrieve user-specific dashboard analytics and statistics."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT p.status, p.saved, e.type
        FROM Progress p
        JOIN Experiment e ON e.id = p.experiment_id
        WHERE p.user_id = ?
    """, (user_id,)).fetchall()
    conn.close()
    
    completed_count = 0
    saved_count = 0
    stat_gates = 0
    stat_circuits = 0
    stat_graphics = 0
    
    for r in rows:
        is_completed = (r['status'] == 'completed')
        is_saved = (r['saved'] == 1)
        
        if is_completed:
            completed_count += 1
            if r['type'] == 'gate':
                stat_gates += 1
            elif r['type'] in ('combinational', 'sequential'):
                stat_circuits += 1
            elif r['type'] == 'cg':
                stat_graphics += 1
                
        if is_saved:
            saved_count += 1
            
    total_available = 24
    progress_pct = int((completed_count / total_available) * 100) if total_available > 0 else 0
    if progress_pct > 100:
        progress_pct = 100
        
    return {
        "progress": progress_pct,
        "completed_experiments": completed_count,
        "saved_experiments": saved_count,
        "stat_total": completed_count,
        "stat_gates": stat_gates,
        "stat_circuits": stat_circuits,
        "stat_graphics": stat_graphics
    }


# ── Badge, Analytics, and Circuit Design helpers ──────────────

def get_user_badges(user_id: int) -> list[str]:
    """Retrieve unlocked badge names for a user."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT badge_name FROM UserBadge WHERE user_id = ?",
        (user_id,)
    ).fetchall()
    conn.close()
    return [r['badge_name'] for r in rows]


def save_user_badges(user_id: int, badges: list[str]) -> None:
    """Save unlocked badges for a user (insert on conflict do nothing)."""
    conn = get_connection()
    try:
        # Delete existing to keep in sync, or insert missing
        conn.execute("DELETE FROM UserBadge WHERE user_id = ?", (user_id,))
        for b in badges:
            conn.execute(
                "INSERT INTO UserBadge (user_id, badge_name) VALUES (?, ?)",
                (user_id, b)
            )
        conn.commit()
    finally:
        conn.close()


def get_user_analytics(user_id: int) -> dict:
    """Retrieve user-specific performance analytics. If none exists, return defaults."""
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM UserAnalytics WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    conn.close()
    if row:
        import json
        try:
            recent = json.loads(row['recent_activity'])
        except Exception:
            recent = []
        return {
            "cpp_downloads": row['cpp_downloads'],
            "lab_time": row['lab_time'],
            "weekly_activity": [int(x) for x in row['weekly_activity'].split(',')],
            "recent_activity": recent
        }
    return {
        "cpp_downloads": 0,
        "lab_time": 0,
        "weekly_activity": [0, 0, 0, 0, 0, 0, 0],
        "recent_activity": []
    }


def save_user_analytics(user_id: int, analytics: dict) -> None:
    """Insert or update user performance analytics."""
    import json
    cpp = analytics.get('cpp_downloads', 0)
    time_val = analytics.get('lab_time', 0)
    weekly = ','.join(str(x) for x in analytics.get('weekly_activity', [0]*7))
    recent = json.dumps(analytics.get('recent_activity', []))
    
    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO UserAnalytics (user_id, cpp_downloads, lab_time, weekly_activity, recent_activity)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                cpp_downloads   = excluded.cpp_downloads,
                lab_time        = excluded.lab_time,
                weekly_activity = excluded.weekly_activity,
                recent_activity = excluded.recent_activity
        """, (user_id, cpp, time_val, weekly, recent))
        conn.commit()
    finally:
        conn.close()


def get_circuit_design(user_id: int) -> str | None:
    """Retrieve saved circuit design JSON for a user."""
    conn = get_connection()
    row = conn.execute(
        "SELECT design_json FROM CircuitDesign WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    conn.close()
    return row['design_json'] if row else None


def save_circuit_design(user_id: int, design_json: str) -> None:
    """Save or update circuit design for a user."""
    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO CircuitDesign (user_id, design_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                design_json = excluded.design_json,
                updated_at  = CURRENT_TIMESTAMP
        """, (user_id, design_json))
        conn.commit()
    finally:
        conn.close()

