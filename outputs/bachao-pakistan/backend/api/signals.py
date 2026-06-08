from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from geopy.distance import geodesic

from services.firebase_service import db
from ml.signal_risk import compute_signal_risk_score, get_signals_on_route

router = APIRouter()


class OnRouteRequest(BaseModel):
    polyline: List[List[float]]  # [[lat, lng], ...]


@router.get("/map")
def get_all_signals():
    """All signals with current risk scores — used by web heatmap."""
    signals = db.collection("signals").stream()
    result = []
    for s in signals:
        data = s.to_dict()
        score, level = compute_signal_risk_score(data)
        result.append({
            "id": s.id,
            **data,
            "current_risk_score": score,
            "current_risk_level": level,
        })
    return result


@router.get("/nearby")
def get_nearby_signals(lat: float, lng: float, radius_km: float = 2.0):
    """Signals within radius, sorted by risk score — used by Home screen."""
    all_signals = db.collection("signals").stream()
    nearby = []
    for s in all_signals:
        data = s.to_dict()
        dist = geodesic((lat, lng), (data["lat"], data["lng"])).km
        if dist <= radius_km:
            score, level = compute_signal_risk_score(data)
            nearby.append({
                "id": s.id,
                "distance_km": round(dist, 2),
                **data,
                "current_risk_score": score,
                "current_risk_level": level,
            })
    nearby.sort(key=lambda x: x["current_risk_score"], reverse=True)
    return nearby


@router.post("/on-route")
def signals_on_route(req: OnRouteRequest):
    """Signals within 300m of any polyline point — pre-loaded at journey start."""
    return get_signals_on_route(req.polyline, threshold_m=300)
