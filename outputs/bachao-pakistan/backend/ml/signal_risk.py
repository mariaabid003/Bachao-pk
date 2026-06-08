"""
Signal risk scoring and proximity detection.
Scores each traffic signal in Karachi by incident history + time of day.
"""
import math
from datetime import datetime
from typing import List, Dict, Optional
try:
    from geopy.distance import geodesic
except ImportError:
    geodesic = None

from services.firebase_service import db


def distance_meters(a: tuple, b: tuple) -> float:
    if geodesic is not None:
        return geodesic(a, b).meters
    lat1, lng1 = map(math.radians, a)
    lat2, lng2 = map(math.radians, b)
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 6_371_000 * 2 * math.asin(math.sqrt(h))


def compute_signal_risk_score(signal_data: dict) -> tuple:
    """
    Returns (risk_score: float, risk_level: str)
    Formula:
        base_score = incidents_7d * 0.4 + incidents_30d * 0.2 + is_known_hotspot * 0.4
        time_multiplier = 1.5 if current hour in peak_hours else 0.5
        final = base_score * time_multiplier (clamped 0-1)
    """
    incidents_7d = signal_data.get("incident_count_week", 0)
    incidents_30d = signal_data.get("incident_count_month", 0)
    is_hotspot = 1 if signal_data.get("risk_level") == "HIGH" else 0

    base_score = (
        min(incidents_7d / 10.0, 1.0) * 0.4 +
        min(incidents_30d / 40.0, 1.0) * 0.2 +
        is_hotspot * 0.4
    )

    current_hour = datetime.utcnow().hour + 5  # PKT offset (UTC+5)
    current_hour = current_hour % 24
    peak_hours = signal_data.get("peak_hours", [])
    # peak_hours may be a string ("9PM-12AM") or a list of ints — handle both
    if isinstance(peak_hours, str):
        peak_match = False  # can't check hour against string range reliably
    else:
        peak_match = current_hour in peak_hours
    time_multiplier = 1.5 if peak_match else 0.5

    final_score = min(base_score * time_multiplier, 1.0)

    if final_score >= 0.7:
        level = "HIGH"
    elif final_score >= 0.4:
        level = "MEDIUM"
    else:
        level = "LOW"

    return round(final_score, 4), level


def get_signals_on_route(polyline: List[List[float]], threshold_m: float = 300) -> List[Dict]:
    """
    Returns all signals within threshold_m of any polyline point.
    polyline = [[lat, lng], ...]
    """
    all_signals = list(db.collection("signals").stream())
    result = []

    for signal_doc in all_signals:
        signal = signal_doc.to_dict()
        s_lat, s_lng = signal["lat"], signal["lng"]

        min_dist = float("inf")
        for point in polyline:
            d = distance_meters((point[0], point[1]), (s_lat, s_lng))
            if d < min_dist:
                min_dist = d

        if min_dist <= threshold_m:
            score, level = compute_signal_risk_score(signal)
            result.append({
                "signal_id": signal_doc.id,
                "name": signal.get("name", "Unknown Signal"),
                "lat": s_lat,
                "lng": s_lng,
                "distance_from_route_m": round(min_dist),
                "risk_level": level,
                "risk_score": score,
                "incident_count_week": signal.get("incident_count_week", 0),
                "peak_hours": signal.get("peak_hours", []),
            })

    result.sort(key=lambda x: x["risk_score"], reverse=True)
    return result


def check_signal_proximity(
    current_lat: float,
    current_lng: float,
    signals_on_route: List[Dict],
    warned_signals: List[str],
    warn_distance_m: float = 200,
) -> Optional[Dict]:
    """
    Checks if user is within warn_distance_m of any un-warned HIGH-risk signal.
    Returns signal data dict if warning should fire, else None.
    Only fires during peak hours.
    """
    current_hour = (datetime.utcnow().hour + 5) % 24  # PKT

    for signal in signals_on_route:
        if signal["signal_id"] in warned_signals:
            continue
        if signal["risk_level"] != "HIGH":
            continue

        dist = distance_meters((current_lat, current_lng), (signal["lat"], signal["lng"]))
        if dist <= warn_distance_m:
            if current_hour in signal.get("peak_hours", []):
                return {
                    **signal,
                    "distance_meters": round(dist),
                }

    return None
