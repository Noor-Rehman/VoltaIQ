"""
import_data.py — VoltaIQ
========================
Imports the processed load-shedding schedule with weather data
into the PostgreSQL 'load_shedding_schedules' table.

Determines the 'schedule_template_date' from the latest month in
islamabad_weather_hourly.csv, mimicking the logic in
join_weather_schedule.py.

Usage:
  python database/import_data.py
"""

import os
import pandas as pd
import psycopg2
import psycopg2.extras
from pathlib import Path
from datetime import date, datetime
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ──────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parents[1]  # VoltaIQ root directory
PROCESSED_CSV_PATH = BASE_DIR / "data" / "processed" / "iesco_schedule_with_weather_final.csv"
WEATHER_CSV_PATH = BASE_DIR / "data" / "weather" / "islamabad_weather_hourly.csv"

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file at the project root.")

TABLE_NAME = "load_shedding_schedules"


def get_schedule_template_date(weather_csv_path: Path) -> date:
    """
    Determines the template date based on the latest month in the weather data.
    This logic mimics join_weather_schedule.py.
    """
    weather = pd.read_csv(weather_csv_path)
    weather["datetime"] = pd.to_datetime(weather["datetime"], errors="coerce")
    weather = weather.dropna(subset=["datetime"])

    target_period = weather["datetime"].dt.to_period("M").max()
    return target_period.start_time.date()


def import_data_to_db():
    print("🚀 Starting data import to PostgreSQL...")

    # 1. Get the schedule template date
    try:
        schedule_template_date = get_schedule_template_date(WEATHER_CSV_PATH)
        print(f"🗓️  Determined schedule template date: {schedule_template_date}")
    except Exception as e:
        print(f"❌ Error determining schedule template date: {e}")
        return

    # 2. Load the processed CSV
    if not PROCESSED_CSV_PATH.exists():
        print(f"❌  Processed CSV not found: {PROCESSED_CSV_PATH}")
        print("    Please ensure 'iesco_schedule_with_weather_final.csv' exists.")
        print("    You might need to run 'python data/weather/join_weather_schedule.py' first.")
        return

    try:
        df = pd.read_csv(PROCESSED_CSV_PATH, dtype={
            'sr_no': int, 'disco': str, 'feeder_name': str, 'grid_station': str,
            'schedule_type': str, 'slot_start': str, 'slot_end': str,
            'duration_hours': float, 'raw_slot': str, 'source_file': str,
            'temperature_2m': float, 'relative_humidity_2m': float,
            'apparent_temperature': float, 'precipitation': float,
            'wind_speed_10m': float, 'shortwave_radiation': float, 'is_day': int
        })
        print(f"📋 Loaded {len(df):,} rows from {PROCESSED_CSV_PATH.name}")
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        return

    # 3. Connect to PostgreSQL (Neon) via DATABASE_URL
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("✅ Connected to Neon PostgreSQL database")

        # 4. Prepare all rows in memory first (no DB calls yet)
        rows_to_insert = []
        skipped = 0

        for index, row in df.iterrows():
            slot_start_time_str = row['slot_start']
            try:
                time_obj = pd.to_datetime(slot_start_time_str, format="%H:%M").time()
                scheduled_template_timestamp = datetime.combine(schedule_template_date, time_obj)
            except ValueError:
                print(f"⚠️  Skipping row {index} due to invalid slot_start format: {slot_start_time_str}")
                skipped += 1
                continue

            values = (
                row['sr_no'],
                row['disco'],
                row['feeder_name'],
                row['grid_station'],
                row['schedule_type'],
                time_obj,
                pd.to_datetime(row['slot_end'], format="%H:%M").time() if pd.notna(row['slot_end']) else None,
                row['duration_hours'],
                row['raw_slot'],
                row['source_file'],
                row['temperature_2m'],
                row['relative_humidity_2m'],
                row['apparent_temperature'],
                row['precipitation'],
                row['wind_speed_10m'],
                row['shortwave_radiation'],
                row['is_day'],
                schedule_template_date,
                scheduled_template_timestamp
            )
            rows_to_insert.append(values)

        if skipped:
            print(f"⚠️  Skipped {skipped} row(s) total due to invalid slot_start format")

        # 5. Bulk insert all rows in one batched operation
        insert_sql = f"""
        INSERT INTO {TABLE_NAME} (
            sr_no, disco, feeder_name, grid_station, schedule_type,
            slot_start, slot_end, duration_hours, raw_slot, source_file,
            temperature_2m, relative_humidity_2m, apparent_temperature,
            precipitation, wind_speed_10m, shortwave_radiation, is_day,
            schedule_template_date, scheduled_template_timestamp
        ) VALUES %s
        """

        psycopg2.extras.execute_values(cur, insert_sql, rows_to_insert, page_size=1000)
        conn.commit()
        print(f"✅ Successfully inserted {len(rows_to_insert):,} rows into '{TABLE_NAME}'")

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()
            print("🔗 Database connection closed.")


if __name__ == "__main__":
    import_data_to_db()