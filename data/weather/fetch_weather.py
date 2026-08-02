"""
fetch_weather.py  —  VoltaIQ project
--------------------------------------
Fetches hourly historical weather for Islamabad/Rawalpindi from Open-Meteo
and saves it as a clean CSV ready to join with load-shedding schedule data.

Location  :  Islamabad  lat=33.6169  lon=73.0933
Date range:  2023-01-01  →  2025-04-30  (~2.3 years, ~20,000 hourly rows)

Variables fetched (all free, no API key):
  temperature_2m          °C
  relative_humidity_2m    %
  apparent_temperature    °C  (feels-like)
  precipitation           mm
  wind_speed_10m          km/h
  shortwave_radiation     W/m²  (solar intensity — strong predictor of AC load)
  is_day                  1/0

Output:
  data/weather/islamabad_weather_hourly.csv

Usage:
  python data/weather/fetch_weather.py

Then to join with schedule:
  python data/weather/join_weather_schedule.py
"""

import requests
import csv
import time
import sys
from pathlib import Path
from datetime import datetime

# ── Config ─────────────────────────────────────────────────────────────────────
LAT        = 33.6169
LON        = 73.0933
START_DATE = "2023-01-01"
END_DATE   = "2025-04-30"
TIMEZONE   = "Asia/Karachi"

# All weather variables we want
HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "wind_speed_10m",
    "shortwave_radiation",
    "is_day",
]

BASE_URL   = "https://archive-api.open-meteo.com/v1/archive"
OUTPUT_DIR = Path(__file__).resolve().parent
# Default output path (relative to repo root when run from project)
OUTPUT_CSV = "data/raw/islamabad_weather_hourly.csv"


def parse_cli_args():
    import argparse
    parser = argparse.ArgumentParser(description="Fetch historical weather (Open-Meteo)")
    parser.add_argument("--start", dest="start", help="Start date YYYY-MM-DD", default=None)
    parser.add_argument("--end", dest="end", help="End date YYYY-MM-DD", default=None)
    parser.add_argument("--output", dest="output", help="Output CSV path", default=None)
    return parser.parse_args()

# ── Fetcher ────────────────────────────────────────────────────────────────────

def fetch_weather_chunk(start: str, end: str) -> dict:
    """Fetch one date-range chunk from Open-Meteo. Returns parsed JSON."""
    params = {
        "latitude":   LAT,
        "longitude":  LON,
        "start_date": start,
        "end_date":   end,
        "hourly":     ",".join(HOURLY_VARS),
        "timezone":   TIMEZONE,
    }
    resp = requests.get(BASE_URL, params=params, timeout=60)

    if resp.status_code != 200:
        raise RuntimeError(
            f"API error {resp.status_code}: {resp.text[:300]}"
        )
    return resp.json()


def parse_response(data: dict) -> list[dict]:
    """Flatten the API response into a list of hourly row dicts."""
    hourly = data.get("hourly", {})
    times  = hourly.get("time", [])

    if not times:
        raise ValueError("API returned no hourly data.")

    rows = []
    for i, timestamp in enumerate(times):
        # timestamp = "2023-01-01T00:00"
        dt = datetime.fromisoformat(timestamp)
        row = {
            "datetime":              timestamp,
            "date":                  dt.date().isoformat(),
            "hour":                  dt.hour,
            "day_of_week":           dt.strftime("%A"),    # Monday, Tuesday …
            "month":                 dt.month,
            "is_weekend":            1 if dt.weekday() >= 4 else 0,   # Fri=4, Sat=5
        }
        for var in HOURLY_VARS:
            values = hourly.get(var, [])
            row[var] = values[i] if i < len(values) else None
        rows.append(row)
    return rows


CSV_FIELDS = [
    "datetime", "date", "hour", "day_of_week", "month", "is_weekend",
] + HOURLY_VARS


def write_csv(rows: list[dict], path: Path) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


# ── Chunked fetcher (splits into yearly chunks to avoid timeouts) ──────────────

def date_chunks(start: str, end: str, chunk_months: int = 6) -> list[tuple[str,str]]:
    """Split a date range into chunks of `chunk_months` months."""
    from datetime import date
    from dateutil.relativedelta import relativedelta   # pip install python-dateutil

    chunks = []
    cur = datetime.strptime(start, "%Y-%m-%d").date()
    end_d = datetime.strptime(end, "%Y-%m-%d").date()

    while cur <= end_d:
        chunk_end = min(cur + relativedelta(months=chunk_months) - relativedelta(days=1), end_d)
        chunks.append((cur.isoformat(), chunk_end.isoformat()))
        cur = chunk_end + relativedelta(days=1)

    return chunks


def main():
    print("=" * 60)
    print("VoltaIQ — Weather Data Fetcher")
    print(f"Location  : Islamabad  ({LAT}N, {LON}E)")
    print(f"Date range: {START_DATE}  →  {END_DATE}")
    print(f"Variables : {', '.join(HOURLY_VARS)}")
    print("=" * 60)

    # Try to import dateutil; install if missing
    try:
        from dateutil.relativedelta import relativedelta
    except ImportError:
        print("\n📦  Installing python-dateutil …")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install",
                               "python-dateutil", "--break-system-packages", "-q"])
        from dateutil.relativedelta import relativedelta

    # Allow overriding via CLI
    args = parse_cli_args()
    start_date = args.start or START_DATE
    end_date = args.end or END_DATE
    out_csv = args.output or OUTPUT_CSV

    chunks = date_chunks(start_date, end_date, chunk_months=6)
    print(f"\nFetching in {len(chunks)} chunks of ~6 months each:\n")

    all_rows = []

    for i, (chunk_start, chunk_end) in enumerate(chunks, 1):
        print(f"  [{i}/{len(chunks)}]  {chunk_start}  →  {chunk_end}  … ", end="", flush=True)
        try:
            data = fetch_weather_chunk(chunk_start, chunk_end)
            rows = parse_response(data)
            all_rows.extend(rows)
            print(f"{len(rows):,} rows ✓")
        except Exception as e:
            print(f"ERROR: {e}")
            print("       Retrying once after 5 seconds …")
            time.sleep(5)
            try:
                data = fetch_weather_chunk(chunk_start, chunk_end)
                rows = parse_response(data)
                all_rows.extend(rows)
                print(f"       {len(rows):,} rows ✓  (retry succeeded)")
            except Exception as e2:
                print(f"       FAILED again: {e2}  — skipping chunk")

        time.sleep(0.5)   # be polite to the free API

    if not all_rows:
        print("\nNo data fetched. Check your internet connection.")
        return

    # Ensure output directory exists (path may be relative)
    out_path = Path(out_csv)
    if not out_path.is_absolute():
        out_path = OUTPUT_DIR.parent / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    write_csv(all_rows, out_path)

    # Summary
    print(f"\n── Summary ─────────────────────────────────────────")
    print(f"  Total hourly rows : {len(all_rows):,}")
    print(f"  Date range        : {all_rows[0]['date']}  →  {all_rows[-1]['date']}")
    temps = [r["temperature_2m"] for r in all_rows if r["temperature_2m"] is not None]
    print(f"  Temp range (°C)   : {min(temps):.1f}  →  {max(temps):.1f}")
    print(f"\nSaved  →  {out_path}")
    print("\n  Next step: run  python data/weather/join_weather_schedule.py")


if __name__ == "__main__":
    main()