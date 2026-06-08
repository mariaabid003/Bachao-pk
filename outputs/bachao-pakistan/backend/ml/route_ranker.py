"""
Route safety ranker — scores Google Maps alternatives by crime + signal risk.
"""
from geopy.distance import geodesic
from services.firebase_service import db
from ml.signal_risk import compute_signal_risk_score


def _get_hotspots():
    return [h.to_dict() for h in db.collection("hotspots").stream()]


def _get_signals():
    return [(s.id, s.to_dict()) for s in db.collection("signals").stream()]


def _route_penalty(polyline: list, hotspots: list, signals: list) -> dict:
    """Score a route. Lower = safer."""
    hotspot_penalty = 0
    signal_penalty = 0
    signals_on_route = 0
    hotspots_on_route = 0

    for point in polyline:
        lat, lng = point[0], point[1]

        for hs in hotspots:
            dist = geodesic((lat, lng), (hs["center_lat"], hs["center_lng"])).meters
            if dist < hs.get("radius_meters", 500):
                hotspot_penalty += 1
                hotspots_on_route += 1
                break

        for sid, sig in signals:
            dist = geodesic((lat, lng), (sig["lat"], sig["lng"])).meters
            if dist < 150:
                score, level = compute_signal_risk_score(sig)
                if level == "HIGH":
                    signal_penalty += score
                    signals_on_route += 1
                break

    return {
        "total_penalty": hotspot_penalty + signal_penalty * 2,
        "signals_on_route": signals_on_route,
        "hotspots_on_route": hotspots_on_route,
    }


def rank_routes(routes_from_maps: list) -> list:
    """
    routes_from_maps: list of dicts from Google Maps Directions API
    Each must have: polyline (list of [lat,lng]), duration_minutes
    Returns ranked list with safety info.
    """
    hotspots = _get_hotspots()
    signals = _get_signals()

    scored = []
    for route in routes_from_maps:
        polyline = route["polyline"]
        penalties = _route_penalty(polyline, hotspots, signals)
        total = penalties["total_penalty"]
        max_possible = len(polyline) * 3  # rough normalisation
        safety_score = round(1.0 - min(total / max(max_possible, 1), 1.0), 2)

        scored.append({
            **route,
            "safety_score": safety_score,
            "signals_on_route": penalties["signals_on_route"],
            "hotspots_on_route": penalties["hotspots_on_route"],
        })

    scored.sort(key=lambda x: x["safety_score"], reverse=True)

    labels = ["Safest Route", "Balanced Route", "Fastest Route"]
    for i, route in enumerate(scored):
        route["rank"] = i + 1
        route["safety_label"] = labels[i] if i < len(labels) else f"Route {i+1}"

    return scored
