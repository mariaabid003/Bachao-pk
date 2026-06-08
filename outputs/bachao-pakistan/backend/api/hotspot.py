from fastapi import APIRouter
from services.firebase_service import db
from geopy.distance import geodesic

router = APIRouter()


@router.get("/map")
def get_all_hotspots():
    hotspots = db.collection("hotspots").stream()
    return [{"id": h.id, **h.to_dict()} for h in hotspots]


@router.get("/nearby")
def get_nearby_hotspots(lat: float, lng: float, radius_km: float = 5.0):
    all_hotspots = db.collection("hotspots").stream()
    nearby = []
    for h in all_hotspots:
        data = h.to_dict()
        dist = geodesic((lat, lng), (data["center_lat"], data["center_lng"])).km
        if dist <= radius_km:
            nearby.append({"id": h.id, "distance_km": round(dist, 2), **data})
    nearby.sort(key=lambda x: x["distance_km"])
    return nearby
