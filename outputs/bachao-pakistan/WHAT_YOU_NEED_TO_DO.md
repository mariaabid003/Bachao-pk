# Bachao Pakistan — What You Need To Do

All 57 files are written. Here is exactly what you need to do to get this running.

---

## STEP 1 — Get Your API Keys (do this first, everything depends on it)

### Firebase
1. Go to https://console.firebase.google.com → Create a new project → call it `bachao-pakistan`
2. Enable **Firestore Database** (start in test mode)
3. Enable **Authentication** → Phone
4. Go to Project Settings → Service Accounts → Generate new private key → download JSON
5. From that JSON, copy `project_id`, `private_key`, `client_email`
6. Go to Project Settings → General → Your apps → Add a Web app → copy the `firebaseConfig` object

### Google Maps
1. Go to https://console.cloud.google.com → Create a project
2. Enable these APIs: **Maps JavaScript API**, **Directions API**, **Places API**, **Geocoding API**
3. Create an API key → copy it

### Twilio
1. Go to https://console.twilio.com → Create an account
2. Get a phone number (free trial gives you one)
3. Copy Account SID, Auth Token, and your Twilio phone number

---

## STEP 2 — Backend Setup

```bash
cd bachao-pakistan/backend

# Copy and fill in your keys
cp .env.example .env
# Open .env and fill in every value

# Install dependencies
pip install -r requirements.txt

# Run locally
python main.py
# → API now running at http://localhost:8000
# → Visit http://localhost:8000/docs to see all endpoints
```

**One thing you must do manually in backend:** The risk scorer uses simulated training data. Before production, replace the `CRIME_INDEX` dict in `ml/risk_scorer.py` with real values from your `karachi_crime.csv`. The file goes in `backend/data/karachi_crime.csv` — expected columns: `lat`, `lng`, `datetime`, `type`.

**Also:** `ml/stop_detector.py` has a few hardcoded traffic zones. Add more from `data/traffic_hotspots.geojson` when you have it.

---

## STEP 3 — Seed the Signals Database

The signals collection in Firebase needs to be populated. You have two options:

**Option A (quick demo):** Manually add 5–10 signals in Firebase Console → Firestore → signals collection. Each document needs:
```json
{
  "name": "Teen Talwar Signal",
  "lat": 24.8234,
  "lng": 67.0123,
  "area": "Clifton",
  "risk_level": "HIGH",
  "incident_count_week": 4,
  "incident_count_month": 11,
  "peak_hours": [21, 22, 23],
  "incident_types": ["phone_snatching"],
  "last_updated": "2024-11-15T00:00:00"
}
```

**Option B (proper):** Import from `data/karachi_signals.geojson` using a migration script (you write this once — just read the geojson and write each feature as a Firestore document).

---

## STEP 4 — Run the First Hotspot Clustering

```bash
cd bachao-pakistan/backend
python -m ml.hotspot_cluster
```

This reads your crime CSV + Firebase incidents, runs DBSCAN, and writes hotspot zones to Firestore. Set this up as a cron job (Railway supports this, or use a simple Python schedule).

---

## STEP 5 — Mobile App Setup

```bash
cd bachao-pakistan/mobile

npm install

# Open src/utils/firebase.js
# Replace all "YOUR_..." placeholders with your Firebase web app config

# Open src/utils/constants.js
# Change API_BASE_URL to http://localhost:8000 for local dev
# or to your Railway URL for production

# Run on your phone
npx expo start
# Scan QR with Expo Go app
```

**Two things you must wire up in the mobile app:**

1. **Google Places Autocomplete** in `JourneySetup.jsx` — there's a `// TODO` comment where you need to add destination geocoding. Install `expo-google-places-autocomplete` or use Google's REST Geocoding API via `maps_service` on the backend.

2. **Firebase Phone Auth** — in `Onboarding.jsx`, `signInWithPhoneNumber` requires your Firebase app to have Phone Auth enabled with a verified domain or test phone numbers. For the demo, add your test phone number in Firebase Console → Authentication → Sign-in method → Phone → Phone numbers for testing.

---

## STEP 6 — Web App Setup

```bash
cd bachao-pakistan/web

npm install

# Copy and fill in your keys
cp .env.example .env
# Fill in VITE_GOOGLE_MAPS_KEY and all VITE_FIREBASE_* values

# Run locally
npm run dev
# → http://localhost:5173

# Deploy to Vercel
npx vercel
# Add the same env vars in Vercel dashboard → Settings → Environment Variables
```

---

## STEP 7 — Deploy Backend to Railway

1. Go to https://railway.app → New project → Deploy from GitHub repo
2. Set root directory to `backend/`
3. Add all your env vars from `.env` in Railway → Variables tab
4. Railway auto-detects Python and runs `uvicorn main:app`
5. Copy the generated URL → update `API_BASE_URL` in mobile `constants.js` and `VITE_API_URL` in web `.env`

---

## What's Already Done (you don't need to touch)

- All API endpoints wired and connected
- ML risk scorer (trains on simulated data at startup — works immediately)
- Route deviation detection (Shapely geometry — works immediately)
- Stop detection logic
- Signal proximity detection for biker mode
- DBSCAN clustering logic
- Twilio voice call + SMS pipeline
- Google polyline decoder
- All mobile screens with full navigation
- Shake detector (3 shakes → SOS)
- GPS poller (pings backend every 30s)
- Signal warning component (vibrate + banner, no sound)
- Full web app with dark map, signal pins, filters
- Firebase schema matching the spec exactly

---

## Demo Checklist (for judges)

- [ ] Backend running (Railway or localhost)
- [ ] At least 5–10 signals seeded in Firebase with realistic data
- [ ] At least 2–3 hotspots (run clustering after adding a few incidents manually)
- [ ] Mobile app on Expo Go, phone auth working with test numbers
- [ ] Web app deployed on Vercel with your Google Maps key

---

## Known Gaps to Fix Before Production (not needed for demo)

- Google Places autocomplete in JourneySetup (currently uses hardcoded coords)
- Real `karachi_crime.csv` data from CPLC
- `karachi_signals.geojson` with all Karachi signals
- Background location on iOS (requires physical device + EAS build, not Expo Go)
- Twilio escalation logic (currently calls all contacts simultaneously — add status callbacks for sequential escalation)
- Firebase security rules (currently in test mode — lock down before launch)
