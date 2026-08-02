"""
backend/routers/schedule.py
----------------------------
Routes:
    GET /schedule/{feeder_name}   — slots for one feeder under predicted tier
    GET /schedule/active-now      — all feeders currently in outage
"""

from fastapi import APIRouter, HTTPException, Query
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone, time
from zoneinfo import ZoneInfo
from backend.database import get_db
from backend.models import FeederSchedule, FeederSlot, ActiveNowResponse, ActiveFeeder
from backend.predictor import fetch_live_weather_and_predict

router = APIRouter(prefix="/schedule", tags=["Schedule"])

PKT = ZoneInfo("Asia/Karachi")   # Pakistan Standard Time


def _city_from_source_file(source_file: str) -> str:
    source = (source_file or "").lower()
    if "rawalpindi" in source:
        return "Rawalpindi"
    return "Islamabad"


def _get_prediction() -> dict:
    """Get today's predicted tier (cached by caller if needed)."""
    return fetch_live_weather_and_predict()


def _is_slot_active_now(slot_start: str, slot_end: str, now_time: time) -> bool:
    """Check if current time falls within a slot window."""
    start = datetime.strptime(slot_start, "%H:%M").time()
    end   = datetime.strptime(slot_end,   "%H:%M").time()
    if end == time(0, 0):   # midnight wrap e.g. 23:00 - 00:00
        return now_time >= start
    return start <= now_time < end


def _mins_until_slot_end(slot_end: str, now_time: time) -> int:
    """How many minutes until this slot ends."""
    end = datetime.strptime(slot_end, "%H:%M").time()
    end_mins = end.hour * 60 + end.minute
    now_mins = now_time.hour * 60 + now_time.minute
    diff = end_mins - now_mins
    return diff if diff > 0 else 0


@router.get("/active-now", response_model=ActiveNowResponse)
def active_now():
    """
    Returns all feeders currently in an outage window right now.
    Powers the live heatmap on the frontend.

    Steps:
      1. Get predicted tier for today
      2. Find all slots under that tier
      3. Filter to slots active at current Pakistan time
    """
    try:
        prediction  = _get_prediction()
        tier        = prediction["predicted_tier"]
        now_pkt     = datetime.now(PKT)
        now_time    = now_pkt.time()

        query = """
            SELECT
                feeder_name,
                grid_station,
                source_file,
                slot_start::text,
                slot_end::text
            FROM load_shedding_schedules
            WHERE schedule_type = %s
            ORDER BY feeder_name
        """

        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (tier,))
                rows = cur.fetchall()

        active = []
        for row in rows:
            start_str = str(row["slot_start"])[:5]   # "06:00"
            end_str   = str(row["slot_end"])[:5]

            if _is_slot_active_now(start_str, end_str, now_time):
                active.append(ActiveFeeder(
                    feeder_name  = row["feeder_name"],
                    grid_station = row["grid_station"],
                    city         = _city_from_source_file(row["source_file"]),
                    slot_start   = start_str,
                    slot_end     = end_str,
                    ends_in_mins = _mins_until_slot_end(end_str, now_time),
                ))

        return ActiveNowResponse(
            current_time   = now_pkt.strftime("%H:%M PKT"),
            predicted_tier = tier,
            active_feeders = active,
            total_affected = len(active),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{feeder_name}", response_model=FeederSchedule)
def get_feeder_schedule(
    feeder_name: str,
    tier: str = Query(None, description="Override tier e.g. '8HR'. Defaults to today's prediction."),
):
    """
    Returns the full outage schedule for a specific feeder.
    Uses today's predicted tier unless you override with ?tier=8HR.

    Also returns:
      - is_currently_off: whether this feeder is in outage right now
      - next_outage_slot: the next upcoming slot today
    """
    try:
        # Get tier
        if tier:
            tier = tier.upper()
            valid_tiers = ["2HR", "4HR", "6HR", "8HR", "10HR", "12HR"]
            if tier not in valid_tiers:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid tier '{tier}'. Must be one of {valid_tiers}"
                )
            predicted_hours = float(tier.replace("HR", ""))
        else:
            prediction      = _get_prediction()
            tier            = prediction["predicted_tier"]
            predicted_hours = prediction["predicted_hours"]

        # Fetch feeder info + slots
        query = """
            SELECT
                feeder_name,
                grid_station,
                slot_start::text,
                slot_end::text,
                duration_hours,
                raw_slot
            FROM load_shedding_schedules
            WHERE feeder_name   = %s
              AND schedule_type = %s
            ORDER BY slot_start
        """

        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (feeder_name, tier))
                rows = cur.fetchall()

        if not rows:
            raise HTTPException(
                status_code=404,
                detail=f"Feeder '{feeder_name}' not found or has no slots for tier '{tier}'"
            )

        now_time = datetime.now(PKT).time()
        slots    = []
        is_off   = False
        next_slot = None

        for row in rows:
            start_str = str(row["slot_start"])[:5]
            end_str   = str(row["slot_end"])[:5]

            slot = FeederSlot(
                slot_start     = start_str,
                slot_end       = end_str,
                duration_hours = float(row["duration_hours"]),
                raw_slot       = row["raw_slot"] or f"{start_str}-{end_str}",
            )
            slots.append(slot)

            # Check if currently off
            if _is_slot_active_now(start_str, end_str, now_time):
                is_off = True

            # Find next upcoming slot
            start_time = datetime.strptime(start_str, "%H:%M").time()
            if start_time > now_time and next_slot is None:
                next_slot = f"{start_str}-{end_str}"

        total_hours = sum(s.duration_hours for s in slots)

        return FeederSchedule(
            feeder_name         = rows[0]["feeder_name"],
            grid_station        = rows[0]["grid_station"],
            predicted_tier      = tier,
            predicted_hours     = predicted_hours,
            slots               = slots,
            total_outage_hours  = round(total_hours, 2),
            is_currently_off    = is_off,
            next_outage_slot    = next_slot,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))