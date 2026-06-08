"""
trainer.py
──────────
Train, save, and load the Bachao risk classification model.

Model:     RandomForestClassifier (sklearn)
Persisted: backend/data/risk_model.pkl  (joblib format)
Metadata:  backend/data/model_meta.json (trained_at, n_samples, accuracy)

Usage:
  from ml.trainer import get_model, retrain

  model = get_model()          # loads from disk or trains fresh
  retrain()                    # rebuilds from all current data, saves to disk
"""
import os
import json
import logging
from datetime import datetime, timezone
from time import perf_counter
from typing import Optional

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.utils.class_weight import compute_sample_weight

from ml.data_loader import build_training_dataset, get_last_training_profile

logger = logging.getLogger(__name__)

_HERE      = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(_HERE, "..", "data")
MODEL_PATH = os.path.join(DATA_DIR, "risk_model.pkl")
META_PATH  = os.path.join(DATA_DIR, "model_meta.json")

# Cached in-process model
_cached_model: Optional[RandomForestClassifier] = None
_cached_meta:  dict = {}


# ── Persist / Load ────────────────────────────────────────────────────────────

def save_model(model, meta: dict):
    import sklearn
    os.makedirs(DATA_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    meta["sklearn_version"] = sklearn.__version__
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
    logger.info(f"Model saved to {MODEL_PATH} (sklearn {sklearn.__version__})")


def load_model_from_disk():
    """Load persisted model. Returns (model, meta) or (None, {}).
    Automatically discards pickles saved by a different sklearn major/minor version
    to avoid InconsistentVersionWarning and silent prediction errors.
    """
    if not os.path.exists(MODEL_PATH):
        return None, {}
    try:
        import sklearn
        import warnings
        from sklearn.exceptions import InconsistentVersionWarning

        # Peek at the sklearn version embedded in the pickle without fully loading
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always", InconsistentVersionWarning)
            model = joblib.load(MODEL_PATH)

        if any(issubclass(w.category, InconsistentVersionWarning) for w in caught):
            current = sklearn.__version__
            logger.warning(
                f"risk_model.pkl was saved with a different sklearn version "
                f"(current: {current}). Deleting stale pickle — will retrain."
            )
            os.remove(MODEL_PATH)
            if os.path.exists(META_PATH):
                os.remove(META_PATH)
            return None, {}

        meta  = {}
        if os.path.exists(META_PATH):
            with open(META_PATH) as f:
                meta = json.load(f)
        logger.info(f"Loaded model from disk (trained {meta.get('trained_at','unknown')})")
        return model, meta
    except Exception as e:
        logger.error(f"Failed to load model from disk: {e}")
        return None, {}


# ── Train ─────────────────────────────────────────────────────────────────────

def train_model(X: np.ndarray, y: np.ndarray):
    """
    Train a RandomForestClassifier on (X, y).
    Uses class-weighted samples to handle imbalanced HIGH vs LOW labels.
    Returns (model, meta_dict).
    """
    if len(X) == 0:
        raise ValueError("Cannot train: empty training set")

    started = perf_counter()
    feature_names = [
        "hour_risk", "day_weight",
        "origin_crime_idx", "dest_crime_idx",
        "origin_weekly_incidents", "dest_weekly_incidents",
        "route_length_norm", "journey_type_weight",
        "signals_on_route", "high_risk_signals",
    ]
    class_counts = {int(label): int(count) for label, count in zip(*np.unique(y, return_counts=True))}
    can_holdout = len(X) >= 8 and all(count >= 2 for count in class_counts.values())
    if can_holdout:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.22,
            random_state=42,
            stratify=y,
        )
    else:
        X_train, X_test, y_train, y_test = X, X, y, y

    sample_weights = compute_sample_weight("balanced", y_train)

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train, sample_weight=sample_weights)

    predictions = model.predict(X_test)
    precision, recall, holdout_f1, _ = precision_recall_fscore_support(
        y_test,
        predictions,
        average="binary",
        zero_division=0,
    )
    holdout_accuracy = accuracy_score(y_test, predictions)
    labels = [0, 1]
    matrix = confusion_matrix(y_test, predictions, labels=labels)

    # Cross-validated accuracy (5-fold)
    try:
        cv_folds = max(2, min(5, min(class_counts.values())))
        cv_scores = cross_val_score(model, X, y, cv=cv_folds, scoring="f1")
        f1 = float(cv_scores.mean())
        f1_std = float(cv_scores.std())
    except Exception:
        f1, f1_std = 0.0, 0.0

    importances = [
        {"feature": name, "importance": round(float(score), 4)}
        for name, score in zip(feature_names, model.feature_importances_)
    ]
    importances.sort(key=lambda item: item["importance"], reverse=True)
    duration_ms = int((perf_counter() - started) * 1000)

    meta = {
        "trained_at":     datetime.now(timezone.utc).isoformat(),
        "n_samples":      len(X),
        "n_high_risk":    int(y.sum()),
        "n_low_risk":     int((y == 0).sum()),
        "train_samples":   int(len(X_train)),
        "test_samples":    int(len(X_test)),
        "holdout_accuracy": round(float(holdout_accuracy), 4),
        "holdout_precision": round(float(precision), 4),
        "holdout_recall": round(float(recall), 4),
        "holdout_f1": round(float(holdout_f1), 4),
        "cv_f1_mean":     round(f1, 4),
        "cv_f1_std":      round(f1_std, 4),
        "model_type":     "RandomForestClassifier",
        "n_estimators":   200,
        "max_depth":       10,
        "duration_ms":     duration_ms,
        "feature_names":   feature_names,
        "feature_importances": importances,
        "confusion_matrix": {
            "labels": ["LOW", "HIGH"],
            "matrix": matrix.astype(int).tolist(),
        },
        "training_profile": get_last_training_profile(),
    }

    logger.info(
        f"Model trained: {len(X)} samples | F1={f1:.3f} ± {f1_std:.3f} | "
        f"HIGH={int(y.sum())} LOW={int((y==0).sum())}"
    )
    return model, meta


# ── Public API ────────────────────────────────────────────────────────────────

def retrain() -> dict:
    """
    Full retrain cycle:
      1. Load all data (incidents + journey outcomes)
      2. Train model
      3. Save to disk
      4. Update in-process cache
    Returns the metadata dict.
    """
    global _cached_model, _cached_meta
    logger.info("Starting model retrain...")

    X, y = build_training_dataset()
    if len(X) == 0:
        logger.error("Retrain aborted: no training data")
        return {"error": "no training data"}

    model, meta = train_model(X, y)
    save_model(model, meta)

    _cached_model = model
    _cached_meta  = meta
    logger.info("Retrain complete.")
    return meta


def get_model():
    """
    Return the current model (in-process cache → disk → fresh train).
    This is the main entry point used by risk_scorer.py.
    """
    global _cached_model, _cached_meta

    if _cached_model is not None:
        return _cached_model

    # Try loading from disk
    model, meta = load_model_from_disk()
    if model is not None:
        _cached_model = model
        _cached_meta  = meta
        return _cached_model

    # No persisted model — train fresh from data
    logger.warning("No persisted model found. Training from scratch...")
    retrain()
    return _cached_model


def get_model_meta() -> dict:
    """Return metadata about the currently loaded model."""
    global _cached_meta
    if not _cached_meta and os.path.exists(META_PATH):
        with open(META_PATH) as f:
            _cached_meta = json.load(f)
    return _cached_meta
