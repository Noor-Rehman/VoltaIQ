"""
backend/routers/feeders.py
---------------------------
Routes:
    GET /feeders               — list all feeders
    GET /feeders/search?q=...  — search by name or grid station
"""

from fastapi import APIRouter, HTTPException, Query
from psycopg2.extras import RealDictCursor
from backend.database import get_db
from backend.models import FeederInfo

router = APIRouter(prefix="/feeders", tags=["Feeders"])


@router.get("", response_model=list[FeederInfo])
def list_feeders(
    source: str = Query(None, description="Filter by source_file e.g. 'islamabad.xlsx'"),
    disco:  str = Query(None, description="Filter by disco e.g. 'F-6'"),
):
    """
    Returns all unique feeders in the database.
    Optionally filter by source file (islamabad/rawalpindi) or disco/grid.
    """
    query = """
        SELECT DISTINCT
            feeder_name,
            grid_station,
            disco,
            source_file
        FROM load_shedding_schedules
        WHERE 1=1
    """
    params = []

    if source:
        query  += " AND source_file ILIKE %s"
        params.append(f"%{source}%")
    if disco:
        query  += " AND disco ILIKE %s"
        params.append(f"%{disco}%")

    query += " ORDER BY feeder_name"

    try:
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params or None)
                rows = cur.fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=list[FeederInfo])
def search_feeders(
    q: str = Query(..., min_length=2, description="Search term — feeder name or grid station"),
):
    """
    Search feeders by name or grid station.
    e.g. /feeders/search?q=F-7  or  /feeders/search?q=filtration
    """
    query = """
        SELECT DISTINCT
            feeder_name,
            grid_station,
            disco,
            source_file
        FROM load_shedding_schedules
        WHERE feeder_name    ILIKE %s
           OR grid_station   ILIKE %s
        ORDER BY feeder_name
        LIMIT 50
    """
    pattern = f"%{q}%"

    try:
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (pattern, pattern))
                rows = cur.fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))