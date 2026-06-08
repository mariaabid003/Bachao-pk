# Bachao — Pakistan Safety Intelligence Platform

**Bachao** (بچاؤ — "Save/Protect") is a real-time personal safety platform built for Karachi, Pakistan. It uses machine learning, live crime data, and SMS alerts to help users travel safely, report incidents, and stay aware of high-risk zones.

---

## What It Does

- **Journey Guardian** — Start a timed journey; the app monitors your route and auto-alerts emergency contacts via SMS if you don't mark safe arrival.
- **Crime Heatmap** — Live map of crime hotspots, risk signals, and incidents across Karachi (OSM tiles, Leaflet).
- **Safe Signals** — Real-time radar view of nearby risk signals with color-coded threat levels.
- **Risk Scoring** — ML model (RandomForest) predicts journey risk based on time, route, area crime index, and historical incidents.
- **Incident Reporting** — Citizens can file incident reports that feed back into the ML training pipeline.
- **AI Insights** — Anthropic-powered chat for safety questions and situation analysis.

---

## Architecture

```
bachao-pakistan/
├── backend/          # FastAPI Python API + ML pipeline
│   ├── api/          # Route handlers (incidents, journey, hotspot, signals, risk, AI, alerts…)
│   ├── ml/           # Risk scoring, RandomForest trainer, route ranker, stop detector
│   ├── services/     # Firebase, Twilio SMS, Google Maps, Africa's Talking
│   ├── data/         # Model pickle + metadata (auto-generated)
│   └── main.py       # App entrypoint
├── web/              # React + Vite dashboard (browser)
│   └── src/
│       ├── pages/    # Landing, Dashboard, Heatmap, SafeSignalsMap, Report
│       └── components/ # Navbar, MapView, SignalMarker, StatsBar, IncidentCard
└── mobile/           # Expo (React Native) app (iOS / Android / Web)
    └── src/
        ├── screens/  # Home, JourneySetup, JourneyActive, Heatmap, SafeSignals, Report…
        ├── navigation/
        └── theme.js  # Serene Oversight design tokens
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 51 · React Native 0.74 · React Navigation v7 |
| Web dashboard | React 18 · Vite · React Leaflet · React Router v6 |
| Backend | FastAPI · Uvicorn · Python 3.11 |
| ML | scikit-learn (RandomForestClassifier) · pandas · NumPy · joblib |
| Database | Firebase Firestore |
| SMS alerts | Twilio · Africa's Talking |
| Maps | Google Maps API · OpenStreetMap tiles |
| AI | Anthropic Claude API |
| Scheduling | APScheduler (background hotspot clustering, model retrain) |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- A Firebase project with Firestore enabled
- (Optional) Twilio account for SMS alerts

### 1 — Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env   # fill in your keys (see Environment Variables below)

uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### 2 — Web Dashboard

```bash
cd web
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:8000

npm run dev            # http://localhost:5173
```

### 3 — Mobile App

```bash
cd mobile
npm install --legacy-peer-deps

# Run on a device / simulator
npx expo start

# Run as web (browser preview)
EXPO_OFFLINE=1 CI=1 npx expo start --web --port 8083
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `FIREBASE_API_KEY` | Firebase web API key |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sender number |
| `GOOGLE_MAPS_API_KEY` | Google Maps / Directions API |
| `BASE_URL` | Public URL of the deployed API |
| `FRONTEND_URL` | Public URL of the web dashboard |

### Web (`web/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:8000`) |

---

## ML Pipeline

The risk model is a **RandomForestClassifier** trained on journey outcomes and incident history.

**Features used:**
- Hour-of-day risk weight
- Day-of-week weight
- Origin / destination crime index
- Origin / destination weekly incident count
- Route length (normalized)
- Journey type weight
- Number of signals on route
- High-risk signals on route

**Lifecycle:**
1. First request → model trained from Firestore data and saved to `backend/data/risk_model.pkl`
2. Hit `POST /api/training/retrain` to rebuild from latest data
3. If a pickle was saved by a different sklearn version, it is auto-deleted and retrained (no manual cleanup needed)

---

## API Endpoints (key routes)

| Method | Path | Description |
|---|---|---|
| GET | `/api/signals` | List all risk signals |
| GET | `/api/hotspot` | List crime hotspots |
| GET | `/api/incidents` | List filed incidents |
| POST | `/api/incidents` | File a new incident |
| POST | `/api/journey/start` | Start a monitored journey |
| POST | `/api/journey/{id}/safe` | Mark journey as safe arrival |
| POST | `/api/risk/score` | Get ML risk score for a route |
| POST | `/api/training/retrain` | Retrain the ML model |
| GET | `/api/training/status` | Model metadata + accuracy |
| POST | `/api/ai/chat` | Ask the AI safety assistant |

Full interactive docs: `http://localhost:8000/docs`

---

## Design System — Serene Oversight

Both the web dashboard and mobile app use a unified light-pastel palette:

| Token | Value | Use |
|---|---|---|
| Background | `#F5F7FF` | Page / screen background |
| Surface | `#FFFFFF` | Cards, panels |
| Surface 2 | `#EEF1F9` | Inputs, secondary cards |
| Nav | `#080D1A` | Top/bottom navigation bar |
| Text | `#0D1829` | Primary text |
| Accent | `#0EA5E9` | Teal — highlights, kickers |
| Danger | `#EF4444` | HIGH risk, alerts |
| Warning | `#F59E0B` | MEDIUM risk |
| Safe | `#22C55E` | LOW risk |

---

## Deployment

A `render.yaml` is included for deployment to [Render](https://render.com).

**Backend** → Render Web Service
- Root: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Web** → Render Static Site (or Vercel)
- Root: `web`
- Build: `npm install && npm run build`
- Publish: `dist`

**Mobile** → Expo EAS Build for iOS / Android stores

---

## License

MIT © 2024 Bachao Pakistan
