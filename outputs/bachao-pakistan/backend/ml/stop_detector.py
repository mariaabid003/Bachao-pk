"""
Detects suspicious stops during active journeys.
Ignores known traffic zones (TODO: load from traffic_hotspots.geojson).
"""

# Known high-traffic zones where stopping is normal (lat, lng, radius_m)
# Populate from data/traffic_hotspots.geojson
TRAFFIC_ZONES = [
    (24.8607, 67.0104, 200),  # Numaish
    (24.8772, 67.0648, 200),  # Gulshan Chowrangi
    # Add more from geojson...
]

SPEED_THRESHOLD_KMH = 2.0   # considered stopped below this


def _in_traffic_zone(lat: float, lng: float) -> bool:
    from geopy.distance import geodesic
    for zone_lat, zone_lng, radius in TRAFFIC_ZONES:
        dist = geodesic((lat, lng), (zone_lat, zone_lng)).meters
        if dist <= radius:
            return True
    return False


def check_stop(
    lat: float,
    lng: float,
    speed_kmh: float,
    stop_threshold_minutes: float = 5,
) -> str:
    """
    Returns "unusual_stop" if user appears stopped outside a known traffic zone.
    The actual duration tracking is handled by the ping loop (consecutive pings
    with low speed). This function checks a single ping.
    Returns "ok" otherwise.
    """
    if speed_kmh < SPEED_THRESHOLD_KMH:
        if _in_traffic_zone(lat, lng):
            return "ok"
        # Signal detector on client side handles timing; server flags suspicious
        return "unusual_stop"
    return "ok"
