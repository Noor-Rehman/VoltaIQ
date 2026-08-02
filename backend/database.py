"""
backend/database.py
--------------------
PostgreSQL connection using psycopg2.
All routers import `get_db()` to get a connection.
"""

import os
import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file.")


@contextmanager
def get_db():
    """
    Context manager that yields a psycopg2 connection.
    Automatically closes after use.

    Usage:
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT ...")
                rows = cur.fetchall()
    """
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()


def test_connection() -> bool:
    """Returns True if DB is reachable, False otherwise."""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        return True
    except Exception:
        return False