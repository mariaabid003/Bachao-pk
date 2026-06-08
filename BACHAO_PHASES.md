# Bachao Pakistan — Full Project Phases

> **Platform:** Predictive urban safety app for Karachi  
> **Stack:** React Native (Expo) · React/Vite (Web) · Python FastAPI (Backend)  
> **Last updated:** June 2026

---

## Legend
- ✅ Complete
- 🔧 Partially complete / has known issues
- ❌ Not started

---

## PHASE 1 — Project Foundation ✅
**Goal:** Set up the full monorepo structure with all three apps scaffolded and running.

- [x] Monorepo folder structure (`/mobile`, `/web`, `/backend`)
- [x] Expo SDK 51 React Native app initialized
- [x] React + Vite web dashboard initialized
- [x] Python FastAPI backend initialized
- [x] `requirements.txt`, `package.json` dependencies defined
- [x] `.env` file template created
- [x] Firebase project created and config added to mobile + backend
- [x] CORS configured on FastAPI

---

## PHASE 2 — Backend Core APIs ✅
**Goal:** All REST endpoints working and returning correct data.

- [x] `POST /journey/start` — starts journey, calculates OSRM route + ETA
- [x] `POST /journey/ping` — receives GPS, checks deviation/stop/signal
- [x] `POST /journey/end` — marks journey complete
- [x] `POST /alerts/trigger` — sends SOS to trusted contacts
- [x] `POST /risk/score` — returns risk level + factors for a route
- [x] `GET /hotspot/nearby` — returns nearby crime hotspots
- [x] `GET /signals/nearby` — returns nearby high-risk signals
- [x] `GET /signals/map` — all signals for map view
- [x] `POST /incident/report` — submits a community incident
- [x] `POST /user/register` — creates user profile
- [x] `POST /ai/risk-analysis` — Claude Haiku safety brief
- [x] `POST /ai/sos-message` — Claude Haiku SOS text generator

---

## PHASE 3 — ML Risk Engine ✅
**Goal:** ML models running for risk scoring, anomaly detection, and signal proximity.

- [x] `risk_scorer.py` — RandomForest risk classifier (simulated training data)
- [x] `signal_risk.py` — identifies high-risk signals on route + proximity check
- [x] `route_anomaly.py` — detects GPS deviation from planned polyline
- [x] `stop_detector.py` — detects unusual stops based on speed + time
- [x] `hotspot_cluster.py` — clusters incident reports into hotspot zones
- [x] `route_ranker.py` — ranks alternative routes by safety score

---

## PHASE 4 — Mobile App Screens ✅
**Goal:** All screens built with full navigation flow.

- [x] `Onboarding.jsx` — name, phone, travel mode, trusted contacts (up to 3)
- [x] `Home.jsx` — dashboard with risk overview, quick actions
- [x] `JourneySetup.jsx` — pickup + destination input
- [x] `RiskResult.jsx` — risk score, AI brief, signal warnings, start journey
- [x] `JourneyActive.jsx` — live timer, SOS button, monitoring status
- [x] `SafeArrival.jsx` — journey complete confirmation
- [x] `SafeSignals.jsx` — list of all signals with risk levels
- [x] `IncidentReport.jsx` — community incident submission form

---

## PHASE 5 — Mobile UI Redesign ✅
**Goal:** App looks like a premium, real product (not a prototype).

- [x] Dark theme design system (`theme.js` with color constants)
- [x] All 8 screens redesigned with dark backgrounds, cards, and gradients
- [x] `TimerRing.jsx` — animated SVG countdown ring
- [x] `RiskBadge.jsx` — color-coded risk level chip
- [x] `SignalWarning.jsx` — full-screen signal proximity overlay
- [x] `ContactSelector.jsx` — trusted contact picker component

---

## PHASE 6 — Location Services ✅
**Goal:** Real GPS, autocomplete, and live location work on device.

- [x] `LocationSearch.jsx` — Nominatim OSM autocomplete with Karachi bounding box
- [x] Auto-fill pickup with reverse-geocoded current GPS on JourneySetup open
- [x] `LocationPoller.js` — polls GPS every 30s during active journey
- [x] `reverseGeocode()` utility — lat/lng → human-readable street name
- [x] Web fallback (`LocationPoller.web.js`, `ShakeDetector.web.js`)
- [x] Live address display in `JourneyActive` updating as user moves

---

## PHASE 7 — Journey Monitoring Engine ✅
**Goal:** Background safety checks running throughout the journey.

- [x] ETA-based countdown timer (OSRM duration + 10 min buffer)
- [x] Route deviation detection (3 consecutive off-route pings = alert)
- [x] Unusual stop detection (speed < threshold for N minutes)
- [x] Signal proximity warning with vibration
- [x] `ShakeDetector.js` — 3 shakes in 2s triggers manual SOS
- [x] Auto-SOS when timer reaches 0 and user hasn't pressed "I'm Safe"

---

## PHASE 8 — AI Integration ✅
**Goal:** Claude Haiku provides contextual safety briefs and smart SOS messages.

- [x] AI safety brief on `RiskResult` screen (personalized per route + time)
- [x] AI-generated SOS message passed to alert system
- [x] Backend `/ai` router using `claude-haiku-4-5-20251001`
- [x] Demo fallback when API key unavailable

---

## PHASE 9 — Web Dashboard ✅
**Goal:** Operational web dashboard for monitoring and reporting.

- [x] Landing page with app overview
- [x] Dashboard with stats bar (incidents, active journeys, alerts)
- [x] Leaflet.js heatmap of incident hotspots
- [x] Safe Signals map with risk-level markers
- [x] Incident report viewer

---

## PHASE 10 — Firebase Resilience ✅
**Goal:** App works even when Firebase is unavailable.

- [x] In-memory fallback dict `_journeys` in `journey.py`
- [x] `_save_journey`, `_get_journey`, `_update_journey` helpers with try/except
- [x] `alerts.py` reads from in-memory fallback when Firestore fails
- [x] Firebase Auth with `AsyncStorage` persistence on native

---

---

## PHASE 11 — SMS Delivery Fix 🔧
**Status:** Africa's Talking set up but Pakistani numbers not receiving SMS.  
**Reason:** AT has carrier issues with +92 numbers on trial accounts.

**To do:**
- [ ] Switch SMS backend to **Twilio** or **Infobip** (better Pakistan coverage)
  - `twilio_service.py` already exists in `/backend/services/` — just needs wiring
  - Update `alerts.py` and `user.py` to call Twilio instead of AT
- [ ] Test welcome SMS on registration
- [ ] Test SOS alert SMS delivery end-to-end
- [ ] Add SMS delivery status logging

---

## PHASE 12 — Firebase Production Setup ❌
**Goal:** Backend connected to real Firestore with proper credentials and rules.

- [ ] Generate Firebase service account JSON and add to backend
- [ ] Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env`
- [ ] Write Firestore security rules (users can only read/write their own data)
- [ ] Enable Firestore indexes for journey queries
- [ ] Test full write/read cycle: register → start journey → end journey → alert

---

## PHASE 13 — Authentication & Security ❌
**Goal:** Only authenticated users can access the API; sessions persist.

- [ ] Add JWT middleware to FastAPI (protect all routes except `/user/register`)
- [ ] On registration, return a signed JWT token to the mobile app
- [ ] Store token in AsyncStorage; attach to every API request via axios headers
- [ ] On app launch, check if token exists → skip Onboarding if yes
- [ ] Add logout option in profile/settings screen
- [ ] Rate-limit `/alerts/trigger` to prevent abuse

---

## PHASE 14 — Journey History Screen ❌
**Goal:** User can see past journeys with route, status, and any alerts triggered.

- [ ] New screen `JourneyHistory.jsx` in mobile app
- [ ] Backend `GET /journey/history?user_id=` endpoint
- [ ] Show each journey: origin → destination, date/time, duration, alert status
- [ ] Tap to expand: show route polyline on mini-map, alert type if fired
- [ ] Add "History" tab or link from Home screen

---

## PHASE 15 — Quick SOS (No Journey Required) ❌
**Goal:** One-tap emergency from the home screen without setting up a journey.

- [ ] Large SOS button visible on `Home.jsx`
- [ ] Pressing it immediately calls `/alerts/trigger` with current GPS
- [ ] Sends SMS to all registered trusted contacts
- [ ] Confirm dialog: "Send emergency alert to your contacts?" before firing
- [ ] Works offline with last-known GPS if no signal

---

## PHASE 16 — Emergency Services Locator ❌
**Goal:** Show nearest police station, hospital, and ranger post during active monitoring.

- [ ] Fetch nearest police stations via Overpass API (OpenStreetMap free)
- [ ] Show on map card inside `JourneyActive` screen
- [ ] One-tap call button to dial emergency number (15 Police, 115 Rescue)
- [ ] Cache results so it works without internet mid-journey

---

## PHASE 17 — Ride Capture (Driver/Vehicle Details) ❌
**Goal:** For ride-hailing journeys, capture and share driver details before starting.

- [ ] New step in `JourneySetup` for ride-hailing mode: enter vehicle plate + driver name
- [ ] Automatically send these details via SMS to trusted contacts when journey starts
- [ ] Display plate number on `JourneyActive` screen for quick reference
- [ ] Optional: photo capture of vehicle (share via SMS link)

---

## PHASE 18 — Push Notifications ❌
**Goal:** App sends alerts even when closed or in background.

- [ ] Set up Expo Push Notifications with `expo-notifications`
- [ ] Register device push token on backend at login
- [ ] Send push notification when a trusted contact starts a journey (opt-in)
- [ ] Background alert if journey ping fails for 5+ minutes (user may be offline)
- [ ] Firebase Cloud Messaging (FCM) integration for Android

---

## PHASE 19 — Community Incident Feed ❌
**Goal:** Real-time feed of nearby incidents reported by other users.

- [ ] New screen `IncidentFeed.jsx` showing reports within 5 km of user
- [ ] Backend `GET /incident/nearby?lat=&lng=&radius_km=` endpoint
- [ ] Each card: incident type, area, time ago, anonymous or named
- [ ] Filter by incident type (snatching / robbery / harassment / etc.)
- [ ] Auto-refresh every 2 minutes while app is open

---

## PHASE 20 — Geofence Zone Alerts ❌
**Goal:** Warn user as they enter a high-risk area, even without an active journey.

- [ ] Background geofencing using `expo-location` task manager
- [ ] Load hotspot polygons from backend on app open (cache locally)
- [ ] Trigger notification when user enters a HIGH risk zone
- [ ] "You are near Teen Talwar Signal — elevated phone snatching risk tonight"
- [ ] Snooze option (don't alert again for 30 min)

---

## PHASE 21 — Urdu Language Support ❌
**Goal:** Full app usable in Urdu for non-English-speaking users.

- [ ] Set up `i18n-js` or `react-native-localize` for translations
- [ ] Translate all screen text, labels, and error messages to Urdu
- [ ] Language toggle in settings (EN / اردو)
- [ ] AI prompts to Claude updated to return Urdu when language is Urdu
- [ ] SMS alert text sent in Urdu to trusted contacts
- [ ] RTL layout support for Urdu screens

---

## PHASE 22 — User Profile & Settings Screen ❌
**Goal:** User can edit their profile, contacts, and app preferences after onboarding.

- [ ] New screen `Settings.jsx` accessible from Home
- [ ] Edit name, phone number, default travel mode
- [ ] Add / remove / edit trusted contacts (up to 3)
- [ ] Notification preferences toggle
- [ ] Language preference toggle
- [ ] "Delete my account" option (GDPR compliance)

---

## PHASE 23 — Admin Web Dashboard ❌
**Goal:** City authorities or NGO administrators can monitor city-wide safety in real time.

- [ ] Password-protected admin route on web dashboard
- [ ] Real-time map of all active journeys (anonymized)
- [ ] Live incident heatmap updating as reports come in
- [ ] Alert log: all SOS events with timestamp, location, trigger type
- [ ] Export reports as CSV for law enforcement
- [ ] Area risk trend charts (week-over-week incident change by zone)

---

## PHASE 24 — ML Model Retraining Pipeline ❌
**Goal:** Risk model improves over time using real community-reported data.

- [ ] Incident reports feed into a training queue in Firebase
- [ ] Weekly cron job retrains `risk_scorer.py` with accumulated real data
- [ ] Model versioning — keep last 3 trained models, rollback if accuracy drops
- [ ] Replace hardcoded `CRIME_INDEX` dict with dynamic area scores from incidents
- [ ] A/B test old vs new model on a subset of risk score requests

---

## PHASE 25 — Offline Mode ❌
**Goal:** Core safety features work without internet (common in Karachi dead zones).

- [ ] Cache last risk assessment result locally (`AsyncStorage`)
- [ ] Cache signal and hotspot data (refresh when online, use stale when not)
- [ ] Journey monitoring continues offline — pings queue up and send when reconnected
- [ ] SOS falls back to native SMS (`expo-sms`) if API unreachable
- [ ] Show "Offline — using cached data" banner when no connection

---

## PHASE 26 — Testing & QA ❌
**Goal:** App is stable and tested before wider release.

- [ ] Unit tests for all ML modules (`pytest`)
- [ ] API integration tests for all backend endpoints
- [ ] Mobile component tests with Jest + React Native Testing Library
- [ ] End-to-end journey test: register → setup → start → ping → SOS → end
- [ ] Load test `/journey/ping` endpoint (target: 500 concurrent journeys)
- [ ] Test on low-end Android (Android 9, 2GB RAM) — Karachi's most common device

---

## PHASE 27 — Beta Launch & User Feedback ❌
**Goal:** Release to a small group of real Karachi users and collect feedback.

- [ ] Build production APK with `eas build --platform android`
- [ ] Distribute via Google Play Internal Testing track
- [ ] Set up crash reporting (`expo-updates` + Sentry)
- [ ] In-app feedback button → sends to backend log
- [ ] Onboard 50 beta users across 3–4 Karachi neighborhoods
- [ ] Track: journeys started, SOS rate, "I'm Safe" completion rate

---

## PHASE 28 — Production Deployment ❌
**Goal:** App live on Play Store and App Store; backend on a real server.

- [ ] Deploy FastAPI backend to **Railway** or **Render** (free tier)
- [ ] Set up domain + HTTPS for backend API
- [ ] Update `API_BASE_URL` in mobile app to production URL
- [ ] Publish to Google Play Store (Android first)
- [ ] Submit to Apple App Store (requires paid developer account)
- [ ] Set up uptime monitoring (UptimeRobot free)
- [ ] Firebase production environment separate from dev

---

## Summary

| # | Phase | Status |
|---|-------|--------|
| 1 | Project Foundation | ✅ Done |
| 2 | Backend Core APIs | ✅ Done |
| 3 | ML Risk Engine | ✅ Done |
| 4 | Mobile App Screens | ✅ Done |
| 5 | Mobile UI Redesign | ✅ Done |
| 6 | Location Services | ✅ Done |
| 7 | Journey Monitoring Engine | ✅ Done |
| 8 | AI Integration | ✅ Done |
| 9 | Web Dashboard | ✅ Done |
| 10 | Firebase Resilience | ✅ Done |
| 11 | SMS Delivery Fix | 🔧 Broken — needs Twilio |
| 12 | Firebase Production Setup | ❌ Not started |
| 13 | Authentication & Security | ❌ Not started |
| 14 | Journey History Screen | ❌ Not started |
| 15 | Quick SOS (No Journey) | ❌ Not started |
| 16 | Emergency Services Locator | ❌ Not started |
| 17 | Ride Capture (Driver Details) | ❌ Not started |
| 18 | Push Notifications | ❌ Not started |
| 19 | Community Incident Feed | ❌ Not started |
| 20 | Geofence Zone Alerts | ❌ Not started |
| 21 | Urdu Language Support | ❌ Not started |
| 22 | User Profile & Settings | ❌ Not started |
| 23 | Admin Web Dashboard | ❌ Not started |
| 24 | ML Model Retraining Pipeline | ❌ Not started |
| 25 | Offline Mode | ❌ Not started |
| 26 | Testing & QA | ❌ Not started |
| 27 | Beta Launch | ❌ Not started |
| 28 | Production Deployment | ❌ Not started |

**10 of 28 phases complete. 18 remaining.**

---

> **For the coworker:** Start with Phases 11–13 (SMS, Firebase, Auth) — these are blockers for everything else. The app cannot be used safely in production without working SMS and proper authentication. All code is in `/outputs/bachao-pakistan/`.
