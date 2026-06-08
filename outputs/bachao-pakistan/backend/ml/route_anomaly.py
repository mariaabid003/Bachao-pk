"""
Detect when a user deviates from a planned route polyline.
Uses Shapely when installed, with a small segment-distance fallback.
"""
import math

try:
    from shapely.geometry import LineString, Point
except ImportError:
    LineString = None
    Point = None


def check_deviation(
    current_lat: float,
    current_lng: float,
    polyline: list,
    threshold_meters: float = 300,
) -> bool:
    """Return True if the user is farther than threshold_meters from the route."""
    if not polyline or len(polyline) < 2:
        return False

    if Point is not None and LineString is not None:
        point = Point(current_lng, current_lat)
        line = LineString([(p[1], p[0]) for p in polyline])
        return point.distance(line) * 111_139 > threshold_meters

    return _fallback_check_deviation(current_lat, current_lng, polyline, threshold_meters)


def _fallback_check_deviation(current_lat, current_lng, polyline, threshold_meters):
    x0, y0 = _to_meters(current_lat, current_lng, current_lat)
    min_distance = float("inf")
    for start, end in zip(polyline, polyline[1:]):
        x1, y1 = _to_meters(start[0], start[1], current_lat)
        x2, y2 = _to_meters(end[0], end[1], current_lat)
        min_distance = min(min_distance, _point_to_segment_distance(x0, y0, x1, y1, x2, y2))
    return min_distance > threshold_meters


def _to_meters(lat, lng, ref_lat):
    return (
        lng * 111_139 * math.cos(math.radians(ref_lat)),
        lat * 111_139,
    )


def _point_to_segment_distance(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    nearest_x = x1 + t * dx
    nearest_y = y1 + t * dy
    return math.hypot(px - nearest_x, py - nearest_y)
