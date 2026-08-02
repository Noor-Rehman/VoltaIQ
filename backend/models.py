"""
backend/models.py
------------------
Pydantic schemas for all API request bodies and responses.
FastAPI uses these for automatic validation and docs.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Prediction ─────────────────────────────────────────────────────────────────

class WeatherInput(BaseModel):
    """
    Body for POST /predict/tier
    Send current or forecast weather → get predicted schedule tier.
    All fields match Open-Meteo variable names.
    """
    month:              int   = Field(..., ge=1, le=12,   description="Month (1-12)")
    avg_temp:           float = Field(...,                description="Average temperature °C")
    max_temp:           float = Field(...,                description="Max temperature °C")
    min_temp:           float = Field(...,                description="Min temperature °C")
    avg_humidity:       float = Field(..., ge=0, le=100,  description="Avg relative humidity %")
    avg_apparent_temp:  float = Field(...,                description="Avg feels-like temperature °C")
    total_precip:       float = Field(0.0, ge=0,          description="Total precipitation mm")
    avg_wind:           float = Field(0.0, ge=0,          description="Avg wind speed km/h")
    avg_radiation:      float = Field(0.0, ge=0,          description="Avg shortwave radiation W/m²")
    max_radiation:      float = Field(0.0, ge=0,          description="Max shortwave radiation W/m²")

    class Config:
        json_schema_extra = {
            "example": {
                "month": 6,
                "avg_temp": 36.0,
                "max_temp": 42.0,
                "min_temp": 28.0,
                "avg_humidity": 38.0,
                "avg_apparent_temp": 38.5,
                "total_precip": 0.0,
                "avg_wind": 12.0,
                "avg_radiation": 280.0,
                "max_radiation": 850.0,
            }
        }


class TierPrediction(BaseModel):
    """Response from POST /predict/tier and GET /predict/today"""
    predicted_tier:    str   # "2HR" / "4HR" / "6HR" / "8HR" / "10HR" / "12HR"
    predicted_hours:   float # e.g. 8.3
    weather_used:      dict  # echo back the weather features used
    tier_meaning:      str   # human-readable explanation


# ── Feeders ────────────────────────────────────────────────────────────────────

class FeederInfo(BaseModel):
    """One feeder row returned by /feeders"""
    feeder_name:   str
    grid_station:  str
    disco:         str
    source_file:   str


class FeederSlot(BaseModel):
    """One outage time slot for a feeder"""
    slot_start:     str   # "06:00"
    slot_end:       str   # "08:00"
    duration_hours: float # 2.0
    raw_slot:       str   # "06:00-08:00"


class FeederSchedule(BaseModel):
    """Response from GET /schedule/{feeder_name}"""
    feeder_name:     str
    grid_station:    str
    predicted_tier:  str
    predicted_hours: float
    slots:           list[FeederSlot]
    total_outage_hours: float
    is_currently_off:   bool
    next_outage_slot:   Optional[str]  # "14:00-16:00" or None if no more today


# ── Active Now ────────────────────────────────────────────────────────────────

class ActiveFeeder(BaseModel):
    """One feeder that is currently in an outage window"""
    feeder_name:  str
    grid_station: str
    city:         str
    slot_start:   str
    slot_end:     str
    ends_in_mins: int   # how many minutes until this outage ends


class ActiveNowResponse(BaseModel):
    """Response from GET /schedule/active-now"""
    current_time:    str
    predicted_tier:  str
    active_feeders:  list[ActiveFeeder]
    total_affected:  int