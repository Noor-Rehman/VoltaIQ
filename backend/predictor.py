"""
backend/predictor.py
---------------------
Loads the trained GBR model and runs predictions.
Also fetches live weather from Open-Meteo for /predict/today.

Two main functions used by routers:
    predict_from_weather(weather_input) -> tier + hours
    fetch_live_weather_and_predict()    -> auto-fetches + predicts (cached)
"""

import pickle
import requests
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone, timedelta

# ── Model paths ──────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent   # VoltaIQ/
MODEL_DIR  = BASE_DIR / "ml_model" / "trained_models"

# ── Load model artifacts once at startup (not on every request) ─────────
def _load_artifacts():
    with open(MODEL_DIR / "outage_regressor.pkl",  "rb") as f:
        model = pickle.load(f)
    with open(MODEL_DIR / "feature_columns.pkl",   "rb") as f:
        feature_cols = pickle.load(f)
    with open(MODEL_DIR / "tier_thresholds.pkl",   "rb") as f:
        thresholds = pickle.load(f)
    return model, feature_cols, thresholds

try:
    _MODEL, _FEATURE_COLS, _THRESHOLDS = _load_artifacts()
    print("✅  ML model loaded successfully")
except Exception as e:
    print(f"⚠️  Could not load ML model: {e}")
    _MODEL, _FEATURE_COLS, _THRESHOLDS = None, None, None


# ── Open-Meteo config (Islamabad coords) ─────────────────────────────────
ISLAMABAD_LAT  = 33.6169
ISLAMABAD_LON  = 73.0933
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# ── Cache config ──────────────────────────────────────────────────────────
CACHE_TTL_MINUTES = 20  # only re-fetch weather at most every 20 minutes

_cache = {
    "result": None,       # last successful prediction dict
    "fetched_at": None,   # datetime of when it was fetched
}

TIER_DESCRIPTIONS = {
    "2HR":  "Low shortfall — 2 hours of outage today",
    "4HR":  "Moderate shortfall — 4 hours of outage today",
    "6HR":  "Significant shortfall — 6 hours of outage today",
    "8HR":  "High shortfall — 8 hours of outage today",
    "10HR": "Severe shortfall — 10 hours of outage today",
    "12HR": "Critical shortfall — 12 hours of outage today",
}


def _hours_to_tier(hours: float) -> str:
    """Map predicted outage hours to schedule tier string."""
    for threshold, tier in _THRESHOLDS:
        if hours <= threshold:
            return tier
    return "12HR"


def _build_feature_row(
    month: int,
    avg_temp: float,
    max_temp: float,
    min_temp: float,
    avg_humidity: float,
    avg_apparent_temp: float,
    total_precip: float,
    avg_wind: float,
    avg_radiation: float,
    max_radiation: float,
) -> pd.DataFrame:
    """Build the feature DataFrame expected by the model."""
    is_summer        = 1 if month in [5, 6, 7, 8, 9] else 0
    temp_x_radiation = avg_temp * avg_radiation

    row = {
        "avg_temp":          avg_temp,
        "max_temp":          max_temp,
        "min_temp":          min_temp,
        "avg_humidity":      avg_humidity,
        "avg_apparent_temp": avg_apparent_temp,
        "total_precip":      total_precip,
        "avg_wind":          avg_wind,
        "avg_radiation":     avg_radiation,
        "max_radiation":     max_radiation,
        "month":             month,
        "is_summer":         is_summer,
        "temp_x_radiation":  temp_x_radiation,
    }
    return pd.DataFrame([row])[_FEATURE_COLS]


# ── Public functions ──────────────────────────────────────────────────────

def predict_from_weather(
    month: int,
    avg_temp: float,
    max_temp: float,
    min_temp: float,
    avg_humidity: float,
    avg_apparent_temp: float,
    total_precip: float = 0.0,
    avg_wind: float = 0.0,
    avg_radiation: float = 0.0,
    max_radiation: float = 0.0,
) -> dict:
    """
    Run prediction from provided weather values.
    Returns: { predicted_tier, predicted_hours, tier_meaning }
    """
    if _MODEL is None:
        raise RuntimeError("ML model not loaded. Run train_model.py first.")

    X = _build_feature_row(
        month, avg_temp, max_temp, min_temp,
        avg_humidity, avg_apparent_temp,
        total_precip, avg_wind, avg_radiation, max_radiation,
    )

    predicted_hours = float(_MODEL.predict(X)[0])
    predicted_hours = max(2.0, min(12.0, predicted_hours))   # clamp
    predicted_tier  = _hours_to_tier(predicted_hours)

    return {
        "predicted_tier":  predicted_tier,
        "predicted_hours": round(predicted_hours, 2),
        "tier_meaning":    TIER_DESCRIPTIONS.get(predicted_tier, ""),
    }


def _fetch_weather_snapshot() -> dict:
    """Fetch today's 24-hour forecast from Open-Meteo and aggregate it."""
    params = {
        "latitude":   ISLAMABAD_LAT,
        "longitude":  ISLAMABAD_LON,
        "hourly":     "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,shortwave_radiation",
        "forecast_days": 1,
        "timezone":   "Asia/Karachi",
    }

    resp = requests.get(OPEN_METEO_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    hourly = data["hourly"]
    temps       = [t for t in hourly["temperature_2m"]          if t is not None]
    humidity    = [h for h in hourly["relative_humidity_2m"]     if h is not None]
    apparent    = [a for a in hourly["apparent_temperature"]     if a is not None]
    precip      = [p for p in hourly["precipitation"]            if p is not None]
    wind        = [w for w in hourly["wind_speed_10m"]           if w is not None]
    radiation   = [r for r in hourly["shortwave_radiation"]      if r is not None]

    now   = datetime.now(timezone.utc)
    month = now.month

    return {
        "month":             month,
        "avg_temp":          round(np.mean(temps),     2),
        "max_temp":          round(np.max(temps),      2),
        "min_temp":          round(np.min(temps),      2),
        "avg_humidity":      round(np.mean(humidity),  2),
        "avg_apparent_temp": round(np.mean(apparent),  2),
        "total_precip":      round(sum(precip),        2),
        "avg_wind":          round(np.mean(wind),      2),
        "avg_radiation":     round(np.mean(radiation), 2),
        "max_radiation":     round(np.max(radiation),  2),
    }

# ── Fallback weather (rough Islamabad seasonal averages, used only when
#    Open-Meteo is unreachable AND we have no cache yet) ──────────────────
def _seasonal_fallback_weather() -> dict:
    now = datetime.now(timezone.utc)
    month = now.month
    is_summer = month in [5, 6, 7, 8, 9]

    if is_summer:
        return {
            "month": month, "avg_temp": 32.0, "max_temp": 40.0, "min_temp": 24.0,
            "avg_humidity": 45.0, "avg_apparent_temp": 34.0, "total_precip": 2.0,
            "avg_wind": 10.0, "avg_radiation": 250.0, "max_radiation": 700.0,
        }
    else:
        return {
            "month": month, "avg_temp": 15.0, "max_temp": 22.0, "min_temp": 8.0,
            "avg_humidity": 55.0, "avg_apparent_temp": 14.0, "total_precip": 1.0,
            "avg_wind": 8.0, "avg_radiation": 130.0, "max_radiation": 450.0,
        }

def fetch_live_weather_and_predict() -> dict:
    now = datetime.now(timezone.utc)

    if _cache["result"] is not None and _cache["fetched_at"] is not None:
        age = now - _cache["fetched_at"]
        if age < timedelta(minutes=CACHE_TTL_MINUTES):
            return _cache["result"]

    try:
        weather_snapshot = _fetch_weather_snapshot()
        result = predict_from_weather(**weather_snapshot)
        result["weather_used"] = weather_snapshot
        result["weather_source"] = "live"

        _cache["result"] = result
        _cache["fetched_at"] = now
        return result

    except Exception as e:
        if _cache["result"] is not None:
            print(f"Open-Meteo fetch failed ({e}), serving stale cached result")
            return _cache["result"]

        # No cache at all — use seasonal fallback so the app still works
        print(f"Open-Meteo fetch failed ({e}), using seasonal fallback weather")
        weather_snapshot = _seasonal_fallback_weather()
        result = predict_from_weather(**weather_snapshot)
        result["weather_used"] = weather_snapshot
        result["weather_source"] = "fallback"

        # Cache this too, with a short TTL so we retry live data sooner
        _cache["result"] = result
        _cache["fetched_at"] = now - timedelta(minutes=CACHE_TTL_MINUTES - 5)
        return result