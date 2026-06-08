"""OSRM routing — free, no API key needed."""
import httpx
from typing import Tuple, List

# Public OSRM demo server (fine for hackathon; host your own for production)
OSRM_URL = "http://router.project-osrm.org/route/v1/driving"


def get_route_polyline(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
    alternatives: bool = False,
) -> Tuple[List[List[float]], int]:
    """
    Returns (polyline_points, duration_seconds).
    polyline_points: [[lat, lng], ...]
    """
    coords = f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
    params = {
        "overview": "full",
        "geometries": "polyline",
        "alternatives": "true" if alternatives else "false",
    }
    try:
        resp = httpx.get(f"{OSRM_URL}/{coords}", params=params, timeout=10)
        data = resp.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            return _straight_line(origin_lat, origin_lng, dest_lat, dest_lng), 1800

        route = data["routes"][0]
        duration = int(route["duration"])
        points = _decode_polyline(route["geometry"])
        return points, duration

    except Exception:
        return _straight_line(origin_lat, origin_lng, dest_lat, dest_lng), 1800


def _straight_line(olat, olng, dlat, dlng):
    return [[olat, olng], [dlat, dlng]]


def _decode_polyline(encoded: str) -> List[List[float]]:
    """Standard polyline decoder (same format as Google)."""
    points = []
    index = 0
    lat = 0
    lng = 0
    while index < len(encoded):
        b, shift, result = 0, 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if result & 1 else result >> 1
        lat += dlat

        b, shift, result = 0, 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if result & 1 else result >> 1
        lng += dlng

        points.append([lat / 1e5, lng / 1e5])
    return points


def build_maps_link(lat: float, lng: float) -> str:
    return f"https://www.openstreetmap.org/?mlat={lat}&mlon={lng}"
