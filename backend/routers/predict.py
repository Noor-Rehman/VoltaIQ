"""
backend/routers/predict.py
---------------------------
Routes:
    POST /predict/tier    — send weather manually, get tier back
    GET  /predict/today   — auto-fetch live weather, get tier back
"""

from fastapi import APIRouter, HTTPException
from backend.models import WeatherInput, TierPrediction
from backend.predictor import predict_from_weather, fetch_live_weather_and_predict

router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post("/tier", response_model=TierPrediction)
def predict_tier(weather: WeatherInput):
    """
    Send today's weather conditions → get predicted schedule tier.

    Use this when you already have weather data (e.g. from your own source).
    """
    try:
        result = predict_from_weather(
            month             = weather.month,
            avg_temp          = weather.avg_temp,
            max_temp          = weather.max_temp,
            min_temp          = weather.min_temp,
            avg_humidity      = weather.avg_humidity,
            avg_apparent_temp = weather.avg_apparent_temp,
            total_precip      = weather.total_precip,
            avg_wind          = weather.avg_wind,
            avg_radiation     = weather.avg_radiation,
            max_radiation     = weather.max_radiation,
        )
        result["weather_used"] = weather.model_dump()
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/today", response_model=TierPrediction)
def predict_today():
    """
    Automatically fetches today's weather from Open-Meteo for Islamabad,
    then predicts the schedule tier.

    No input needed — just call this endpoint and get today's prediction.
    """
    try:
        return fetch_live_weather_and_predict()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))