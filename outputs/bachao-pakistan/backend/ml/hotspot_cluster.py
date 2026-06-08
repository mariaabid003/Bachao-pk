"""
DBSCAN hotspot clustering — runs as a cron job every 24 hours.
Combines CPLC CSV data + Firebase crowdsourced incidents.

Run: python -m ml.hotspot_cluster
"""
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from datetime import datetime, timedelta
import os

from services.firebase_service import db


def load_cplc_incidents() -> pd.DataFrame:
    """Load CPLC crime CSV. Expects columns: lat, lng, datetime, type."""
    csv_path = os.path.join(os.path.dirname(__file__), "../data/karachi_crime.csv")
    try:
        df = pd.read_csv(csv_path)
        df = df[["lat", "lng", "datetime", "type"]].dropna()
        return df
    except FileNotFoundError:
        print("Warning: karachi_crime.csv not found — using only crowdsourced data")
        return pd.DataFrame(columns=["lat", "lng", "datetime", "type"])


def load_firebase_incidents() -> pd.DataFrame:
    rows = []
    for doc in db.collection("incidents").stream():
        d = doc.to_dict()
        rows.append({
            "lat": d.get("lat"),
            "lng": d.get("lng"),
            "datetime": d.get("datetime"),
            "type": d.get("type"),
        })
    return pd.DataFrame(rows).dropna(subset=["lat", "lng"])


def determine_peak_hours(cluster_incidents: pd.DataFrame) -> list:
    try:
        hours = pd.to_datetime(cluster_incidents["datetime"]).dt.hour
        counts = hours.value_counts()
        return sorted(counts[counts >= counts.mean()].index.tolist())
    except Exception:
        return [20, 21, 22, 23]


def determine_trend(cluster_id: str, current_count: int) -> str:
    """Compare with last stored count."""
    try:
        doc = db.collection("hotspots").document(cluster_id).get()
        if doc.exists:
            prev = doc.to_dict().get("incident_count", current_count)
            if current_count > prev * 1.1:
                return "up"
            elif current_count < prev * 0.9:
                return "down"
    except Exception:
        pass
    return "stable"


def run_clustering():
    print(f"[{datetime.utcnow()}] Starting hotspot clustering...")

    cplc_df = load_cplc_incidents()
    fb_df = load_firebase_incidents()
    df = pd.concat([cplc_df, fb_df], ignore_index=True)

    if df.empty:
        print("No incident data found.")
        return

    coords = df[["lat", "lng"]].values
    coords_rad = np.radians(coords)

    # DBSCAN: eps in radians (~500m), min 3 incidents per cluster
    eps_rad = 500 / 6_371_000  # 500m in radians
    db_model = DBSCAN(eps=eps_rad, min_samples=3, algorithm="ball_tree", metric="haversine")
    labels = db_model.fit_predict(coords_rad)

    df["cluster"] = labels
    clustered = df[df["cluster"] >= 0]

    hotspots = {}
    for cluster_id, group in clustered.groupby("cluster"):
        center_lat = group["lat"].mean()
        center_lng = group["lng"].mean()
        count = len(group)
        types = group["type"].value_counts().index.tolist()
        peak = determine_peak_hours(group)

        # Determine risk level
        risk = "HIGH" if count >= 10 else "MEDIUM"

        hotspot_id = f"cluster_{cluster_id}"
        trend = determine_trend(hotspot_id, count)

        hotspots[hotspot_id] = {
            "center_lat": center_lat,
            "center_lng": center_lng,
            "radius_meters": 500,
            "incident_count": count,
            "risk_level": risk,
            "peak_hours": peak,
            "incident_types": types[:3],
            "trending": trend,
            "updated_at": datetime.utcnow().isoformat(),
        }

    # Write to Firebase
    for hid, data in hotspots.items():
        db.collection("hotspots").document(hid).set(data)

    print(f"Clustering complete. {len(hotspots)} hotspots stored.")


if __name__ == "__main__":
    run_clustering()
