from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import logging
import os
import uuid

from services.firebase_service import db

router = APIRouter()
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CROWD_INCIDENTS_PATH = os.path.join(DATA_DIR, "crowd_incidents.jsonl")


class IncidentReportRequest(BaseModel):
    type: str           # phone_snatching | ride_hailing | mugging | signal_robbery | harassment | other
    lat: float
    lng: float
    signal_name: Optional[str] = None
    datetime_str: Optional[str] = None
    description: Optional[str] = None
    anonymous: bool = True


@router.post("/report")
def report_incident(req: IncidentReportRequest):
    incident_id = str(uuid.uuid4())
    doc = {
        "id": incident_id,
        "type": req.type,
        "lat": req.lat,
        "lng": req.lng,
        "signal_name": req.signal_name,
        "datetime": req.datetime_str or datetime.utcnow().isoformat(),
        "description": req.description,
        "anonymous": req.anonymous,
        "created_at": datetime.utcnow().isoformat(),
        "source": "app_report",
    }
    try:
        db.collection("incidents").document(incident_id).set(doc)
    except Exception as e:
        logger.warning(f"Firebase incident write failed ({e}); saving local crowd report")
        _append_local_incident(doc)

    # If signal robbery, flag signal for risk recalculation
    if req.signal_name and req.type in ["signal_robbery", "phone_snatching"]:
        _flag_signal_for_recalc(req.signal_name)

    return {"status": "reported", "incident_id": incident_id}


@router.get("/list")
def list_incidents(limit: int = 50):
    try:
        incidents = db.collection("incidents").order_by("created_at", direction="DESCENDING").limit(limit).stream()
        return [{"id": i.id, **i.to_dict()} for i in incidents]
    except Exception as e:
        logger.warning(f"Firebase incident list failed ({e}); reading local crowd reports")
        return _read_local_incidents(limit)


def _flag_signal_for_recalc(signal_name: str):
    """Mark a signal as needing risk recalculation on next cron run."""
    try:
        signals = db.collection("signals").where("name", "==", signal_name).stream()
        for s in signals:
            db.collection("signals").document(s.id).update({"needs_recalc": True})
    except Exception as e:
        logger.warning(f"Signal recalculation flag failed ({e})")


def _append_local_incident(doc: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CROWD_INCIDENTS_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(doc) + "\n")


def _read_local_incidents(limit: int = 50) -> list:
    if not os.path.exists(CROWD_INCIDENTS_PATH):
        return []
    rows = []
    with open(CROWD_INCIDENTS_PATH, encoding="utf-8") as f:
        for line in f:
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    rows.sort(key=lambda row: row.get("created_at", ""), reverse=True)
    return rows[:limit]
