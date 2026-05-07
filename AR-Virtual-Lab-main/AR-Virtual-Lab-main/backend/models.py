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
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)       REFERENCES User(id),
            FOREIGN KEY (experiment_id) REFERENCES Experiment(id),
            UNIQUE(user_id, experiment_id)
        )
    """)

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

def create_user(name: str, email: str, password: str) -> dict:
    """
    Insert a new user. Returns the user dict or raises ValueError
    if the email already exists.
    """
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO User (name, email, password) VALUES (?, ?, ?)",
            (name, email.lower().strip(), generate_password_hash(password))
        )
        conn.commit()
        user = conn.execute(
            "SELECT id, name, email FROM User WHERE email = ?",
            (email.lower().strip(),)
        ).fetchone()
        return dict(user)
    except sqlite3.IntegrityError:
        raise ValueError("A user with this email already exists.")
    finally:
        conn.close()


def authenticate_user(email: str, password: str) -> dict | None:
    """
    Verify credentials. Returns user dict on success, None on failure.
    """
    conn = get_connection()
    user = conn.execute(
        "SELECT * FROM User WHERE email = ?",
        (email.lower().strip(),)
    ).fetchone()
    conn.close()

    if user and check_password_hash(user['password'], password):
        return {"id": user['id'], "name": user['name'], "email": user['email']}
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
