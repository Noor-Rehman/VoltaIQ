"""
join_weather_schedule.py — VoltaIQ
====================================
Joins iesco_schedules.csv with islamabad_weather_hourly.csv.

Join key:  date + hour
  - schedule has no "date" column — it has schedule_type slots that repeat
    every day, so we join purely on hour (the hour of slot_start).
    Weather is joined by hour only, giving the typical weather for that
    hour of day across the dataset.

  - If you later add a "date" column to the schedule (once IESCO publishes
    dated schedules), the join can be upgraded to date+hour.

Output: data/processed/iesco_schedule_with_weather_final.csv

Columns match the schema already in your processed folder:
  sr_no, disco, feeder_name, grid_station,
  schedule_type, slot_start, slot_end, duration_hours, raw_slot, source_file,
  temperature_2m, relative_humidity_2m, apparent_temperature,
  precipitation, wind_speed_10m, shortwave_radiation, is_day

Usage:
  python data/weather/join_weather_schedule.py
"""

import pandas as pd
from pathlib import Path

BASE_DIR     = Path(__file__).resolve().parents[2]
SCHEDULE_CSV = BASE_DIR / "data" / "processed" / "iesco_schedules.csv"
WEATHER_CSV  = Path(__file__).resolve().parent / "islamabad_weather_hourly.csv"
OUTPUT_CSV   = BASE_DIR / "data" / "processed" / "iesco_schedule_with_weather_final.csv"


def main():
    # ── Load schedule ──────────────────────────────────────────────────────────
    if not SCHEDULE_CSV.exists():
        print(f"❌  Not found: {SCHEDULE_CSV}")
        print("    Run:  python data/parser/iesco_parser.py  first.")
        return

    sched = pd.read_csv(SCHEDULE_CSV, dtype=str)
    print(f"📋  Schedule rows : {len(sched):,}")
    print(f"    Columns       : {list(sched.columns)}")

    # Extract hour integer from slot_start ("02:00" → 2)
    sched["hour"] = sched["slot_start"].str.split(":").str[0].astype(int)

    # ── Load weather ───────────────────────────────────────────────────────────
    if not WEATHER_CSV.exists():
        print(f"\n❌  Not found: {WEATHER_CSV}")
        print("    Run:  python data/weather/fetch_weather.py  first.")
        print("    (or place islamabad_weather_hourly.csv in data/weather/)")
        return

    weather = pd.read_csv(WEATHER_CSV)
    print(f"\n🌡️   Weather rows  : {len(weather):,}")
    print(f"    Date range    : {weather['datetime'].min()}  →  {weather['datetime'].max()}")

    # ── Parse datetime and derive the join hour from the real timestamp ───────
    weather["datetime"] = pd.to_datetime(weather["datetime"], errors="coerce")
    weather = weather.dropna(subset=["datetime"])
    weather["hour"] = weather["datetime"].dt.hour

    # ── Use the latest month available in the weather file ────────────────────
    # The schedule is a daily template, so the most meaningful merge is the
    # average weather for each hour across the latest complete month we have.
    target_period = weather["datetime"].dt.to_period("M").max()
    weather_month = weather[weather["datetime"].dt.to_period("M") == target_period].copy()
    print(f"    Using month   : {target_period}")
    print(f"    Filtered rows : {len(weather_month):,}")

    # ── Build hourly weather averages for that month (one row per hour 0-23) ──
    # Each row = average conditions for that hour across all days in month.
    weather_cols = [
        "temperature_2m", "relative_humidity_2m", "apparent_temperature",
        "precipitation", "wind_speed_10m", "shortwave_radiation", "is_day",
    ]
    available = [c for c in weather_cols if c in weather_month.columns]
    hourly_avg = (
      weather_month.groupby("hour")[available]
        .mean()
        .round(1)
        .reset_index()
    )
    print(f"\n📊  Hourly weather averages built  ({len(hourly_avg)} hours × {len(available)} vars)")

    # ── Join ───────────────────────────────────────────────────────────────────
    merged = sched.merge(hourly_avg, on="hour", how="left")

    # Drop the helper hour column — not in the final schema
    merged.drop(columns=["hour"], inplace=True)

    # ── Column order — exactly matches the schema in user's CSV ───────────────
    final_cols = [
        "sr_no", "disco", "feeder_name", "grid_station",
        "schedule_type", "slot_start", "slot_end", "duration_hours",
        "raw_slot", "source_file",
    ] + available

    # Keep only columns that exist
    final_cols = [c for c in final_cols if c in merged.columns]
    merged = merged[final_cols]

    # ── Save ───────────────────────────────────────────────────────────────────
    merged.to_csv(OUTPUT_CSV, index=False)

    print(f"\n── Output ────────────────────────────────────────────")
    print(f"  Rows    : {len(merged):,}")
    print(f"  Columns : {list(merged.columns)}")
    print(f"\n  Sample row:")
    row = merged.iloc[2]
    for k, v in row.items():
        print(f"    {k:<25} = {v}")

    print(f"\n✅  Saved  →  {OUTPUT_CSV.name}")


if __name__ == "__main__":
    main()