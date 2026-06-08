from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime, timedelta
import logging

from services.firebase_service import db
from services.maps_service import get_route_polyline
from ml.risk_scorer import score_risk
from ml.signal_risk import get_signals_on_route
from ml.route_anomaly import check_deviation
from ml.stop_detector import check_stop

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory fallback store when Firebase is unavailable
_journeys: dict = {}


class JourneyStartRequest(BaseModel):
    user_id: str
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    contact_phone: str
    contact_name: str
    risk_level: str
    journey_type: str  # ride_hailing | solo | biker
    plate_number: Optional[str] = None


class JourneyPingRequest(BaseModel):
    journey_id: str
    current_lat: float
    current_lng: float
    current_speed: float
    timestamp: str


def _save_journey(journey_id: str, doc: dict):
    """Save to Firebase; fall back to memory on failure."""
    try:
        db.collection("journeys").document(journey_id).set(doc)
    except Exception as e:
        logger.warning(f"Firebase write failed ({e}); using memory store")
        _journeys[journey_id] = doc


def _get_journey(journey_id: str) -> Optional[dict]:
    try:
        snap = db.collection("journeys").document(journey_id).get()
        if snap.exists:
            return snap.to_dict()
    except Exception as e:
        logger.warning(f"Firebase read failed ({e}); checking memory store")
    return _journeys.get(journey_id)


def _update_journey(journey_id: str, fields: dict):
    try:
        db.collection("journeys").document(journey_id).update(fields)
        if journey_id in _journeys:
            _journeys[journey_id].update(fields)
    except Exception as e:
        logger.warning(f"Firebase update failed ({e}); updating memory store")
        if journey_id in _journeys:
            _journeys[journey_id].update(fields)


@router.post("/start")
def start_journey(req: JourneyStartRequest):
    journey_id = str(uuid.uuid4())

    try:
        polyline, duration_seconds = get_route_polyline(
            req.origin_lat, req.origin_lng,
            req.destination_lat, req.destination_lng
        )
    except Exception as e:
        logger.warning(f"Route calculation failed ({e}); using estimate")
        # Estimate: ~20 min for Karachi urban journey
        polyline = [[req.origin_lat, req.origin_lng], [req.destination_lat, req.destination_lng]]
        duration_seconds = 1200

    signals_on_route = []
    if req.journey_type == "biker":
        try:
            signals_on_route = get_signals_on_route(polyline)
        except Exception as e:
            logger.warning(f"Signal check failed: {e}")

    thresholds = {
        "LOW":    {"deviation_m": 500, "stop_min": 7,  "signal_warn_m": 200},
        "MEDIUM": {"deviation_m": 300, "stop_min": 5,  "signal_warn_m": 250},
        "HIGH":   {"deviation_m": 200, "stop_min": 3,  "signal_warn_m": 300},
    }
    t = thresholds.get(req.risk_level, thresholds["MEDIUM"])

    expected_arrival = (datetime.utcnow() + timedelta(seconds=duration_seconds)).strftime("%H:%M")

    journey_doc = {
        "userId": req.user_id,
        "status": "active",
        "journey_type": req.journey_type,
        "origin": {"lat": req.origin_lat, "lng": req.origin_lng},
        "destination": {"lat": req.destination_lat, "lng": req.destination_lng},
        "polyline": polyline,
        "risk_level": req.risk_level,
        "signals_on_route": signals_on_route,
        "warned_signals": [],
        "contact": {"name": req.contact_name, "phone": req.contact_phone},
        "consecutive_flags": 0,
        "last_lat": req.origin_lat,
        "last_lng": req.origin_lng,
        "last_ping": datetime.utcnow().isoformat(),
        "started_at": datetime.utcnow().isoformat(),
        "ended_at": None,
        "deviation_threshold_m": t["deviation_m"],
        "stop_threshold_min": t["stop_min"],
        "signal_warn_distance_m": t["signal_warn_m"],
    }

    _save_journey(journey_id, journey_doc)

    return {
        "journey_id": journey_id,
        "polyline": polyline,
        "expected_arrival": expected_arrival,
        "timer_duration_seconds": duration_seconds + 600,  # 10 min buffer
        "deviation_threshold_meters": t["deviation_m"],
        "stop_threshold_minutes": t["stop_min"],
        "signals_on_route": signals_on_route,
    }


@router.post("/ping")
def ping_journey(req: JourneyPingRequest):
    journey = _get_journey(req.journey_id)

    if not journey or journey.get("status") != "active":
        return {"status": "ok", "message": "Journey not active"}

    polyline             = journey.get("polyline", [])
    deviation_threshold  = journey.get("deviation_threshold_m", 300)
    stop_threshold       = journey.get("stop_threshold_min", 5)
    journey_type         = journey.get("journey_type", "solo")
    signals_on_route     = journey.get("signals_on_route", [])
    warned_signals       = journey.get("warned_signals", [])
    signal_warn_distance = journey.get("signal_warn_distance_m", 200)

    try:
        is_deviated = check_deviation(req.current_lat, req.current_lng, polyline, deviation_threshold)
    except Exception:
        is_deviated = False

    flags = journey.get("consecutive_flags", 0)
    if is_deviated:
        flags += 1
        _update_journey(req.journey_id, {"consecutive_flags": flags})
        if flags >= 3:
            return {"status": "alert", "message": "Route deviation detected"}
        return {"status": "deviation", "message": "You appear to be off your planned route"}

    if flags > 0:
        _update_journey(req.journey_id, {"consecutive_flags": 0})

    try:
        stop_status = check_stop(req.current_lat, req.current_lng, req.current_speed, stop_threshold)
        if stop_status == "unusual_stop":
            return {"status": "stop", "message": "You appear to have stopped. Are you okay?"}
    except Exception:
        pass

    if journey_type == "biker":
        try:
            from ml.signal_risk import check_signal_proximity
            signal_warning = check_signal_proximity(
                req.current_lat, req.current_lng,
                signals_on_route, warned_signals, signal_warn_distance
            )
            if signal_warning:
                warned_signals.append(signal_warning["signal_id"])
                _update_journey(req.journey_id, {"warned_signals": warned_signals})
                return {
                    "status": "signal_warning",
                    "message": f"High-risk signal ahead: {signal_warning['name']}",
                    "signal_data": signal_warning,
                }
        except Exception:
            pass

    _update_journey(req.journey_id, {
        "last_lat": req.current_lat,
        "last_lng": req.current_lng,
        "last_ping": datetime.utcnow().isoformat(),
    })

    return {"status": "ok", "message": "All clear"}


@router.post("/end")
def end_journey(journey_id: str):
    try:
        _update_journey(journey_id, {
            "status": "completed",
            "ended_at": datetime.utcnow().isoformat(),
        })
    except Exception as e:
        logger.warning(f"End journey failed: {e}")
    return {"status": "completed"}
