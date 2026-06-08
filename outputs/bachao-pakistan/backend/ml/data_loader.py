"""
data_loader.py
Loads Karachi crime data and builds feature/label arrays for model training.
"""
import os, math, logging, sys, json
from datetime import datetime
from typing import Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

_HERE        = os.path.dirname(os.path.abspath(__file__))
DATA_DIR     = os.path.join(_HERE, "..", "data")
CRIME_CSV    = os.path.join(DATA_DIR, "karachi_crime.csv")
INCIDENT_CSV = os.path.join(DATA_DIR, "karachi_incidents.csv")
FIR_CSV      = os.path.join(DATA_DIR, "karachi_fir.csv")
CROWD_JSONL  = os.path.join(DATA_DIR, "crowd_incidents.jsonl")

_crime_df:    Optional[pd.DataFrame] = None
_incident_df: Optional[pd.DataFrame] = None
_last_training_profile: dict = {}

DAY_WEIGHTS = {
    "Monday": 0.45, "Tuesday": 0.45, "Wednesday": 0.50,
    "Thursday": 0.55, "Friday": 0.80, "Saturday": 0.90, "Sunday": 0.65,
}
JOURNEY_TYPE_WEIGHT = {"ride_hailing": 0.55, "solo": 0.80, "biker": 0.88}


def load_crime_areas() -> pd.DataFrame:
    global _crime_df
    if _crime_df is not None:
        return _crime_df
    try:
        _crime_df = pd.read_csv(CRIME_CSV)
        logger.info("Loaded %d crime areas", len(_crime_df))
    except FileNotFoundError:
        logger.error("karachi_crime.csv not found at %s", CRIME_CSV)
        _crime_df = pd.DataFrame()
    return _crime_df


def get_area_crime_index(lat: float, lng: float) -> dict:
    df = load_crime_areas()
    if df.empty:
        return {"crime_index": 0.50, "area_name": "Unknown",
                "weekly_incidents": 10, "top_incident_type": "mugging"}
    match = df[(df.lat_min <= lat) & (lat <= df.lat_max) &
               (df.lng_min <= lng) & (lng <= df.lng_max)]
    if not match.empty:
        if len(match) > 1:
            # Multiple overlapping boxes: prefer the most specific (smallest area)
            match = match.copy()
            match["_box_size"] = (match.lat_max - match.lat_min) * (match.lng_max - match.lng_min)
            row = match.loc[match["_box_size"].idxmin()]
        else:
            row = match.iloc[0]
        return {"crime_index": float(row.crime_index), "area_name": row.area_name,
                "weekly_incidents": int(row.weekly_incidents),
                "top_incident_type": row.top_incident_type}
    df2 = df.copy()
    df2["dist"] = df2.apply(
        lambda r: math.sqrt((r.lat_center - lat)**2 + (r.lng_center - lng)**2), axis=1)
    row = df2.loc[df2.dist.idxmin()]
    return {"crime_index": float(row.crime_index), "area_name": row.area_name,
            "weekly_incidents": int(row.weekly_incidents),
            "top_incident_type": row.top_incident_type}


def load_incidents() -> pd.DataFrame:
    global _incident_df
    if _incident_df is not None:
        return _incident_df
    try:
        _incident_df = pd.read_csv(INCIDENT_CSV, parse_dates=["timestamp"])
        logger.info("Loaded %d historical incidents", len(_incident_df))
    except FileNotFoundError:
        logger.error("karachi_incidents.csv not found at %s", INCIDENT_CSV)
        _incident_df = pd.DataFrame()
    return _incident_df


def load_fir_incidents() -> pd.DataFrame:
    """
    Optional real FIR ingest.
    Place Karachi Police FIR exports at backend/data/karachi_fir.csv with lat/lng
    and any of: timestamp, datetime, date, incident_type, type, severity.
    """
    if not os.path.exists(FIR_CSV):
        return pd.DataFrame()
    try:
        df = pd.read_csv(FIR_CSV)
        logger.info("Loaded %d FIR rows", len(df))
        return _normalize_incident_rows(df, source="karachi_police_fir")
    except Exception as e:
        logger.warning("Could not load FIR CSV at %s: %s", FIR_CSV, e)
        return pd.DataFrame()


def load_local_crowd_incidents() -> pd.DataFrame:
    if not os.path.exists(CROWD_JSONL):
        return pd.DataFrame()
    rows = []
    with open(CROWD_JSONL, encoding="utf-8") as f:
        for line in f:
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    if not rows:
        return pd.DataFrame()
    return _normalize_incident_rows(pd.DataFrame(rows), source="app_report_local")


def load_firebase_crowd_incidents() -> pd.DataFrame:
    try:
        from services.firebase_service import db
        rows = []
        for doc in db.collection("incidents").stream():
            data = doc.to_dict()
            data["id"] = getattr(doc, "id", data.get("id"))
            rows.append(data)
        if not rows:
            return pd.DataFrame()
        return _normalize_incident_rows(pd.DataFrame(rows), source="app_report_firebase")
    except Exception as e:
        logger.warning("Firebase crowd incident load skipped: %s", e)
        return pd.DataFrame()


def _normalize_incident_rows(df: pd.DataFrame, source: str) -> pd.DataFrame:
    if df.empty:
        return df

    out = pd.DataFrame()
    out["lat"] = pd.to_numeric(df.get("lat"), errors="coerce")
    out["lng"] = pd.to_numeric(df.get("lng"), errors="coerce")

    timestamp = None
    for col in ["timestamp", "datetime", "datetime_str", "created_at", "date"]:
        if col in df.columns:
            timestamp = pd.to_datetime(df[col], errors="coerce")
            break
    if timestamp is None:
        timestamp = pd.Series([pd.NaT] * len(df))
    timestamp = timestamp.fillna(pd.Timestamp.utcnow())
    out["timestamp"] = timestamp
    out["hour"] = pd.to_numeric(_series_or_default(df, ["hour"], np.nan), errors="coerce").fillna(timestamp.dt.hour).astype(int)
    out["day_of_week"] = _series_or_default(df, ["day_of_week"], timestamp.dt.day_name()).fillna(timestamp.dt.day_name())
    out["incident_type"] = _series_or_default(df, ["incident_type", "type"], "other").fillna("other")
    out["severity"] = _series_or_default(df, ["severity"], "HIGH").fillna("HIGH").astype(str).str.upper()
    out["source"] = source
    return out.dropna(subset=["lat", "lng"])


def _series_or_default(df: pd.DataFrame, columns: list, default):
    for col in columns:
        if col in df.columns:
            return df[col]
    if isinstance(default, pd.Series):
        return default
    return pd.Series([default] * len(df), index=df.index)


def _hour_risk(hour: int) -> float:
    return 0.5 + 0.5 * math.sin(math.pi * (hour - 6) / 17)


def build_feature_vector(origin_lat, origin_lng, dest_lat, dest_lng,
                          hour, day_of_week, journey_type,
                          signals_on_route=0, high_risk_signals=0) -> list:
    o = get_area_crime_index(origin_lat, origin_lng)
    d = get_area_crime_index(dest_lat, dest_lng)
    route_km = math.sqrt((origin_lat - dest_lat)**2 + (origin_lng - dest_lng)**2) * 111
    return [
        _hour_risk(hour),
        DAY_WEIGHTS.get(day_of_week, 0.50),
        o["crime_index"],
        d["crime_index"],
        min(o["weekly_incidents"] / 50.0, 1.0),
        min(d["weekly_incidents"] / 50.0, 1.0),
        min(route_km / 25.0, 1.0),
        JOURNEY_TYPE_WEIGHT.get(journey_type, 0.70),
        min(signals_on_route / 5.0, 1.0),
        min(high_risk_signals / 3.0, 1.0),
    ]


def _incidents_to_training_data():
    historical = _normalize_incident_rows(load_incidents(), source="historical_csv")
    fir = load_fir_incidents()
    firebase_crowd = load_firebase_crowd_incidents()
    local_crowd = load_local_crowd_incidents()
    df = pd.concat([historical, fir, firebase_crowd, local_crowd], ignore_index=True)
    if df.empty:
        return np.array([]), np.array([])
    X, y = [], []
    safe_areas = load_crime_areas()
    safe = safe_areas[safe_areas.crime_index < 0.35] if not safe_areas.empty else pd.DataFrame()
    import random
    rng = random.Random(42)
    for _, row in df.iterrows():
        lat, lng = float(row.lat), float(row.lng)
        hour, day = int(row.hour), str(row.day_of_week)
        jtype = rng.choice(["ride_hailing", "solo", "biker"])
        sigs = rng.randint(0, 4)
        high = rng.randint(0, min(sigs, 2))
        dest_lat = lat + rng.uniform(-0.08, 0.08)
        dest_lng = lng + rng.uniform(-0.08, 0.08)
        feat = build_feature_vector(lat, lng, dest_lat, dest_lng, hour, day, jtype, sigs, high)
        label = 1 if str(row.severity).upper() in ("HIGH", "MEDIUM", "CRITICAL") else 0
        X.append(feat)
        y.append(label)
    if not safe.empty:
        for _ in range(len(X) // 2):
            area = safe.sample(1).iloc[0]
            lat = rng.uniform(area.lat_min, area.lat_max)
            lng = rng.uniform(area.lng_min, area.lng_max)
            hour = rng.randint(7, 18)
            day = rng.choice(["Monday", "Tuesday", "Wednesday", "Thursday"])
            jtype = rng.choice(["ride_hailing", "solo", "biker"])
            dest_lat = lat + rng.uniform(-0.05, 0.05)
            dest_lng = lng + rng.uniform(-0.05, 0.05)
            feat = build_feature_vector(lat, lng, dest_lat, dest_lng, hour, day, jtype, 0, 0)
            X.append(feat)
            y.append(0)
    return np.array(X), np.array(y)


def _journey_outcomes_to_training_data():
    journeys = []
    try:
        from services.firebase_service import db
        for doc in db.collection("journeys").stream():
            journeys.append(doc.to_dict())
    except Exception as e:
        logger.warning("Firebase journey outcome load skipped: %s", e)

    journey_module = sys.modules.get("api.journey")
    if journey_module is not None:
        _journeys = getattr(journey_module, "_journeys", {})
        journeys.extend(_journeys.values())

    X, y = [], []
    seen = set()
    for j in journeys:
        identity = j.get("id") or j.get("journey_id") or (
            j.get("started_at"), j.get("userId"), j.get("status")
        )
        if identity in seen:
            continue
        seen.add(identity)
        status = j.get("status", "")
        if status not in ("completed", "alert_sent"):
            continue
        origin = j.get("origin", {})
        dest   = j.get("destination", {})
        if not origin or not dest:
            continue
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(j.get("started_at", ""))
            hour, day = dt.hour, dt.strftime("%A")
        except Exception:
            hour, day = 20, "Friday"
        jtype = j.get("journey_type", "solo")
        sigs  = len(j.get("signals_on_route", []))
        high  = sum(1 for s in j.get("signals_on_route", [])
                    if s.get("current_risk_level") == "HIGH")
        feat = build_feature_vector(
            origin.get("lat", 24.86), origin.get("lng", 67.01),
            dest.get("lat", 24.86),   dest.get("lng", 67.01),
            hour, day, jtype, sigs, high)
        X.append(feat)
        y.append(1 if status == "alert_sent" else 0)
    if X:
        logger.info("Added %d real journey outcomes", len(X))
    return np.array(X), np.array(y)


def build_training_dataset():
    global _last_training_profile
    X1, y1 = _incidents_to_training_data()
    X2, y2 = _journey_outcomes_to_training_data()
    parts_X = [a for a in [X1, X2] if len(a) > 0]
    parts_y = [a for a in [y1, y2] if len(a) > 0]
    if not parts_X:
        logger.warning("No training data available")
        return np.array([]), np.array([])
    X = np.vstack(parts_X)
    y = np.concatenate(parts_y)
    historical_rows = int(len(load_incidents()))
    fir_rows = int(len(load_fir_incidents()))
    firebase_crowd_rows = int(len(load_firebase_crowd_incidents()))
    local_crowd_rows = int(len(load_local_crowd_incidents()))
    real_incident_rows = historical_rows + fir_rows + firebase_crowd_rows + local_crowd_rows
    generated_safe_examples = max(int(len(X1)) - real_incident_rows, 0)
    _last_training_profile = {
        "historical_incident_rows": historical_rows,
        "fir_rows": fir_rows,
        "firebase_crowd_incident_rows": firebase_crowd_rows,
        "local_crowd_incident_rows": local_crowd_rows,
        "generated_safe_examples": generated_safe_examples,
        "live_journey_outcomes": int(len(X2)),
        "crime_area_rows": int(len(load_crime_areas())),
        "feature_count": int(X.shape[1]) if len(X.shape) > 1 else 0,
    }
    logger.info("Training dataset: %d samples, %d HIGH, %d LOW",
                len(X), int(y.sum()), int((y == 0).sum()))
    return X, y


def get_last_training_profile() -> dict:
    return dict(_last_training_profile)
