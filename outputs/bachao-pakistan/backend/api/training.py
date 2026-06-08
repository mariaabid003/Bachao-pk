"""
training.py
───────────
API endpoints for model management + weekly auto-retrain scheduler.

Endpoints:
  POST /training/retrain  — trigger a full retrain manually
  GET  /training/status   — show current model info (accuracy, trained_at, sample count)

Scheduler:
  APScheduler runs retrain() every Sunday at 03:00 UTC automatically.
"""
import logging
from fastapi import APIRouter
try:
    from apscheduler.schedulers.background import BackgroundScheduler
except ImportError:
    BackgroundScheduler = None

from ml.trainer import retrain, get_model_meta

router    = APIRouter()
logger    = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone="UTC") if BackgroundScheduler else None


# ── Scheduled job ─────────────────────────────────────────────────────────────

def _scheduled_retrain():
    logger.info("[Scheduler] Weekly retrain triggered")
    try:
        meta = retrain()
        logger.info(f"[Scheduler] Retrain complete — F1={meta.get('cv_f1_mean')} samples={meta.get('n_samples')}")
    except Exception as e:
        logger.error(f"[Scheduler] Retrain failed: {e}")


def start_scheduler():
    """Call this once from main.py on startup."""
    if scheduler is None:
        logger.warning("APScheduler is not installed; weekly auto-retrain is disabled")
        return
    if not scheduler.running:
        # Every Sunday at 03:00 UTC
        scheduler.add_job(_scheduled_retrain, "cron", day_of_week="sun", hour=3, minute=0)
        scheduler.start()
        logger.info("APScheduler started — model retrains every Sunday at 03:00 UTC")


def stop_scheduler():
    """Call this from main.py on shutdown."""
    if scheduler is None:
        return
    if scheduler.running:
        scheduler.shutdown(wait=False)


# ── API routes ────────────────────────────────────────────────────────────────

@router.post("/retrain")
def trigger_retrain():
    """
    Manually trigger a full model retrain.
    Combines historical incidents + live journey outcomes from this session.
    Returns training metadata (accuracy, sample counts, timestamp).
    """
    logger.info("Manual retrain requested via API")
    try:
        meta = retrain()
        return {
            "status":    "success",
            "message":   "Model retrained and saved to disk",
            "metadata":  meta,
        }
    except Exception as e:
        logger.error(f"Retrain failed: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/status")
def model_status():
    """
    Returns info about the currently loaded model:
      - trained_at      when it was last trained
      - n_samples       how many samples it was trained on
      - n_high_risk     HIGH/MEDIUM labelled samples
      - n_low_risk      LOW labelled samples
      - cv_f1_mean      5-fold cross-validated F1 score
      - model_type      algorithm used
      - next_retrain    next scheduled retrain time
    """
    meta = get_model_meta()
    if not meta:
        return {"status": "not_trained", "message": "No trained model found. POST /training/retrain to build one."}

    # Next scheduled job time
    next_run = None
    if scheduler is not None:
        jobs = scheduler.get_jobs()
        if jobs:
            next_run = str(jobs[0].next_run_time)

    response = {
        "status":       "loaded",
        "trained_at":   meta.get("trained_at"),
        "n_samples":    meta.get("n_samples"),
        "n_high_risk":  meta.get("n_high_risk"),
        "n_low_risk":   meta.get("n_low_risk"),
        "train_samples": meta.get("train_samples"),
        "test_samples": meta.get("test_samples"),
        "holdout_accuracy": meta.get("holdout_accuracy"),
        "holdout_precision": meta.get("holdout_precision"),
        "holdout_recall": meta.get("holdout_recall"),
        "holdout_f1": meta.get("holdout_f1"),
        "cv_f1_mean":   meta.get("cv_f1_mean"),
        "cv_f1_std":    meta.get("cv_f1_std"),
        "model_type":   meta.get("model_type"),
        "n_estimators": meta.get("n_estimators"),
        "max_depth": meta.get("max_depth"),
        "duration_ms": meta.get("duration_ms"),
        "feature_importances": meta.get("feature_importances", []),
        "confusion_matrix": meta.get("confusion_matrix"),
        "training_profile": meta.get("training_profile", {}),
        "next_retrain": next_run,
    }
    return response
