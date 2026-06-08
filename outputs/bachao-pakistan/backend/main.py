from dotenv import load_dotenv
load_dotenv()  # MUST be before any api imports that touch Firebase

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from api import journey, alerts, risk, hotspot, incident, signals, ai, user, training

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("Bachao API starting up...")

    # Start weekly retrain scheduler
    training.start_scheduler()

    # Kick off an initial model load/train in the background so the first
    # risk score request doesn't have to wait for training
    import threading
    def _preload():
        try:
            from ml.trainer import get_model
            model = get_model()
            from ml.trainer import get_model_meta
            meta = get_model_meta()
            logger.info(
                f"ML model ready — trained: {meta.get('trained_at','unknown')} | "
                f"samples: {meta.get('n_samples',0)} | F1: {meta.get('cv_f1_mean',0)}"
            )
        except Exception as e:
            logger.warning(f"Model preload failed (will train on first request): {e}")

    threading.Thread(target=_preload, daemon=True).start()

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    training.stop_scheduler()
    logger.info("Bachao API shut down.")


app = FastAPI(
    title="Bachao Pakistan API",
    version="2.1",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(journey.router,  prefix="/journey",  tags=["Journey"])
app.include_router(alerts.router,   prefix="/alerts",   tags=["Alerts"])
app.include_router(risk.router,     prefix="/risk",     tags=["Risk"])
app.include_router(hotspot.router,  prefix="/hotspot",  tags=["Hotspot"])
app.include_router(incident.router, prefix="/incident", tags=["Incident"])
app.include_router(signals.router,  prefix="/signals",  tags=["Signals"])
app.include_router(ai.router,       prefix="/ai",       tags=["AI"])
app.include_router(user.router,     prefix="/user",     tags=["User"])
app.include_router(training.router, prefix="/training", tags=["Training"])


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/")
def root():
    from ml.trainer import get_model_meta
    meta = get_model_meta()
    return {
        "status":  "Bachao Pakistan API v2.1 running",
        "model":   meta.get("trained_at", "not yet trained"),
        "samples": meta.get("n_samples", 0),
        "f1":      meta.get("cv_f1_mean", 0),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
