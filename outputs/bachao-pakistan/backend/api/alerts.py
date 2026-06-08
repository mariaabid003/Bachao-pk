from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import logging

from services.firebase_service import db
from services.sms_service import send_voice_call, send_sms
from services.maps_service import build_maps_link

router = APIRouter()
logger = logging.getLogger(__name__)


class AlertTriggerRequest(BaseModel):
    journey_id: str
    trigger_type: str   # timer_expired | route_deviation | unusual_stop | manual_sos
    current_lat: float
    current_lng: float
    sos_message: Optional[str] = None  # AI-generated message (overrides default SMS text)


@router.post("/trigger")
def trigger_alert(req: AlertTriggerRequest):
    # ── 1. Load journey (Firebase → in-memory fallback) ──────────────────────
    journey = None
    try:
        snap = db.collection("journeys").document(req.journey_id).get()
        if snap.exists:
            journey = snap.to_dict()
    except Exception as e:
        logger.warning(f"Firebase journey read failed: {e}")

    if not journey:
        try:
            from api.journey import _journeys
            journey = _journeys.get(req.journey_id)
        except Exception as e:
            logger.warning(f"In-memory journey lookup failed: {e}")

    if not journey:
        logger.error(f"Journey {req.journey_id} not found; proceeding with minimal info")
        journey = {"userId": "unknown", "contact": {}}

    # ── 2. Load user (Firebase only; fall back to anonymous) ─────────────────
    user = None
    user_id = journey.get("userId", "unknown")
    if user_id != "unknown":
        try:
            snap = db.collection("users").document(user_id).get()
            if snap.exists:
                user = snap.to_dict()
        except Exception as e:
            logger.warning(f"Firebase user read failed: {e}")

    if not user:
        user = {"name": "User", "contacts": []}

    # ── 3. Build contact list (trip contact first, then saved contacts) ───────
    name = user.get("name", "User")
    contact = journey.get("contact", {})
    maps_link = build_maps_link(req.current_lat, req.current_lng)

    contacts = list(user.get("contacts", []))
    if contact.get("phone"):
        # Prepend trip contact, dedup by phone number
        contacts = [contact] + [c for c in contacts if c.get("phone") != contact.get("phone")]

    # ── 4. Build messages ────────────────────────────────────────────────────
    if req.sos_message:
        sms_text = req.sos_message
    else:
        trigger_labels = {
            "timer_expired":   "did not confirm safe arrival",
            "route_deviation": "appears to have deviated from their route",
            "unusual_stop":    "has stopped unexpectedly",
            "manual_sos":      "triggered an SOS",
        }
        reason = trigger_labels.get(req.trigger_type, "may need help")
        sms_text = (
            f"🚨 BACHAO ALERT: {name} {reason}.\n"
            f"Last known location:\n{maps_link}\n\n"
            f"Do NOT call them back — it may escalate the situation.\n"
            f"Go to location or contact authorities: 15 (Police)"
        )

    voice_text = (
        f"{name} was travelling and has not confirmed safe arrival. "
        f"Their last known location has been sent to you by SMS."
    )

    # ── 5. Send SMS (and voice call if available) ────────────────────────────
    contacted = []
    for c in contacts[:3]:
        phone = c.get("phone")
        if not phone:
            continue
        try:
            send_sms(phone, sms_text)
            contacted.append(phone)
        except Exception as e:
            logger.error(f"SMS to {phone} failed: {e}")
        try:
            send_voice_call(phone, voice_text)
        except Exception as e:
            logger.warning(f"Voice call to {phone} failed (non-critical): {e}")

    # ── 6. Persist alert record ───────────────────────────────────────────────
    alert_id = str(uuid.uuid4())
    alert_doc = {
        "journeyId": req.journey_id,
        "trigger_type": req.trigger_type,
        "lat": req.current_lat,
        "lng": req.current_lng,
        "contacts_notified": contacted,
        "triggered_at": datetime.utcnow().isoformat(),
    }
    try:
        db.collection("alerts").document(alert_id).set(alert_doc)
    except Exception as e:
        logger.warning(f"Alert save to Firebase failed: {e}")

    # ── 7. Mark journey as alert_sent ─────────────────────────────────────────
    try:
        db.collection("journeys").document(req.journey_id).update({"status": "alert_sent"})
    except Exception as e:
        logger.warning(f"Journey status update failed: {e}")
    try:
        from api.journey import _journeys
        if req.journey_id in _journeys:
            _journeys[req.journey_id]["status"] = "alert_sent"
    except Exception:
        pass

    return {
        "status": "alert_sent",
        "alert_id": alert_id,
        "contacts_notified": contacted,
    }
