from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from ml.risk_scorer import score_risk
from ml.signal_risk import get_signals_on_route
from services.maps_service import get_route_polyline

router = APIRouter()


class RiskScoreRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    time_of_day: str        # "22:30"
    day_of_week: str        # "Monday"
    journey_type: str       # ride_hailing | solo | biker


@router.post("/score")
def get_risk_score(req: RiskScoreRequest):
    polyline, _ = get_route_polyline(
        req.origin_lat, req.origin_lng,
        req.destination_lat, req.destination_lng
    )

    signals_on_route = []
    high_risk_signals = []
    if req.journey_type == "biker":
        signals_on_route = get_signals_on_route(polyline)
        high_risk_signals = [s for s in signals_on_route if s.get("risk_level") == "HIGH"]

    result = score_risk(
        origin_lat=req.origin_lat,
        origin_lng=req.origin_lng,
        destination_lat=req.destination_lat,
        destination_lng=req.destination_lng,
        time_of_day=req.time_of_day,
        day_of_week=req.day_of_week,
        journey_type=req.journey_type,
        signals_on_route_count=len(signals_on_route),
        high_risk_signals_count=len(high_risk_signals),
    )

    risk_factors = result["risk_factors"]
    if high_risk_signals:
        risk_factors.append(f"{len(high_risk_signals)} high-risk signal(s) on this route")

    sensitivity = "normal"
    if result["risk_level"] == "HIGH":
        sensitivity = "tight"
    elif result["risk_level"] == "LOW":
        sensitivity = "relaxed"

    return {
        "risk_level": result["risk_level"],
        "risk_score": result["risk_score"],
        "risk_factors": risk_factors,
        "high_risk_signals": high_risk_signals,
        "recommended_sensitivity": sensitivity,
    }
