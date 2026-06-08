"""
risk_scorer.py
──────────────
Public interface for journey risk scoring.

Now uses:
  • Real Karachi crime areas (karachi_crime.csv) for spatial crime index
  • 1900+ historical incidents (karachi_incidents.csv) for model training
  • Persisted RandomForest model (risk_model.pkl) — loads from disk on startup
  • Falls back to rule-based heuristic if model unavailable
"""
import math
import logging
from typing import Optional

from ml.data_loader import (
    get_area_crime_index,
    build_feature_vector,
    DAY_WEIGHTS,
    JOURNEY_TYPE_WEIGHT,
    _hour_risk,
)
from ml.trainer import get_model

logger = logging.getLogger(__name__)


# ── Risk factor text generator ────────────────────────────────────────────────

def _build_risk_factors(
    hour: int,
    day_of_week: str,
    journey_type: str,
    origin_info: dict,
    dest_info: dict,
    signals_on_route: int,
    high_risk_signals: int,
    risk_score: float,
) -> list:
    factors = []

    # Time-based
    if hour >= 22 or hour <= 3:
        factors.append(f"Late night travel ({hour:02d}:xx) — highest incident window in Karachi")
    elif hour >= 19:
        factors.append(f"Evening travel after {hour}:00 — incident rate rises sharply post-sunset")

    # Day-based
    day_w = DAY_WEIGHTS.get(day_of_week, 0.5)
    if day_w >= 0.85:
        factors.append(f"{day_of_week}s see the highest weekly crime activity in reported data")
    elif day_w >= 0.70:
        factors.append(f"{day_of_week} — elevated street crime compared to weekday baseline")

    # Origin area
    o_idx = origin_info["crime_index"]
    o_name = origin_info["area_name"]
    if o_idx >= 0.75:
        factors.append(
            f"Pickup area ({o_name}) has a crime index of {o_idx:.2f} — "
            f"{origin_info['weekly_incidents']} incidents/week; "
            f"top type: {origin_info['top_incident_type'].replace('_',' ')}"
        )
    elif o_idx >= 0.50:
        factors.append(
            f"Pickup area ({o_name}) has moderate crime risk "
            f"({origin_info['weekly_incidents']} incidents/week)"
        )

    # Destination area
    d_idx = dest_info["crime_index"]
    d_name = dest_info["area_name"]
    if d_idx >= 0.75:
        factors.append(
            f"Destination area ({d_name}) is a high-crime zone — "
            f"common incident: {dest_info['top_incident_type'].replace('_',' ')}"
        )
    elif d_idx >= 0.50:
        factors.append(f"Destination area ({d_name}) has moderate crime activity")

    # Journey type
    if journey_type == "biker":
        factors.append("Biker mode — highest phone-snatching exposure at signals and stops")
    elif journey_type == "solo":
        factors.append("Solo traveller — no driver buffer; increased mugging risk on foot")

    # Signals
    if high_risk_signals >= 2:
        factors.append(
            f"{high_risk_signals} high-risk signals on this route — "
            f"signal robbery is the top crime type at these intersections"
        )
    elif signals_on_route >= 3:
        factors.append(f"{signals_on_route} signals on route — elevated stop-and-snatch exposure")

    # Cap at 4 factors to keep the UI clean
    return factors[:4]


# ── Fallback rule-based scorer ────────────────────────────────────────────────

def _rule_based_score(features: list) -> float:
    """
    Weighted linear combination of features.
    Used as fallback when ML model is unavailable.
    """
    weights = [0.20, 0.10, 0.18, 0.12, 0.05, 0.05, 0.04, 0.12, 0.08, 0.06]
    return min(sum(f * w for f, w in zip(features, weights)), 1.0)


# ── Main public function ──────────────────────────────────────────────────────

def score_risk(
    origin_lat: float,
    origin_lng: float,
    destination_lat: float,
    destination_lng: float,
    time_of_day: str,         # "22:30"
    day_of_week: str,         # "Friday"
    journey_type: str,        # ride_hailing | solo | biker
    signals_on_route_count: int = 0,
    high_risk_signals_count: int = 0,
) -> dict:
    """
    Score the risk of a journey. Returns:
      {
        risk_score: float (0–1),
        risk_level: "HIGH" | "MEDIUM" | "LOW",
        risk_factors: [str],
        origin_area: str,
        destination_area: str,
      }
    """
    hour = int(time_of_day.split(":")[0])

    # Spatial lookup
    origin_info = get_area_crime_index(origin_lat, origin_lng)
    dest_info   = get_area_crime_index(destination_lat, destination_lng)

    # Feature vector
    features = build_feature_vector(
        origin_lat, origin_lng,
        destination_lat, destination_lng,
        hour, day_of_week, journey_type,
        signals_on_route_count,
        high_risk_signals_count,
    )

    # ML model prediction
    proba = None
    try:
        model = get_model()
        if model is not None:
            proba = float(model.predict_proba([features])[0][1])
    except Exception as e:
        logger.warning(f"ML model prediction failed ({e}); using rule-based fallback")

    if proba is None:
        proba = _rule_based_score(features)

    # Classify
    if proba >= 0.60:
        level = "HIGH"
    elif proba >= 0.30:
        level = "MEDIUM"
    else:
        level = "LOW"

    factors = _build_risk_factors(
        hour, day_of_week, journey_type,
        origin_info, dest_info,
        signals_on_route_count, high_risk_signals_count,
        proba,
    )

    return {
        "risk_score":        round(proba, 4),
        "risk_level":        level,
        "risk_factors":      factors,
        "origin_area":       origin_info["area_name"],
        "destination_area":  dest_info["area_name"],
    }
