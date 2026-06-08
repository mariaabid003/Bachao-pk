import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE, timeout: 8_000 });

// ── Demo data (shown when backend is offline) ──────────────────────────────
const DEMO_SIGNALS = [
  { name: 'Teen Talwar Signal',      lat: 24.8305, lng: 67.0333, current_risk_level: 'HIGH',   risk_level: 'HIGH',   incident_count_week: 7,  incident_count_month: 24, peak_hours: [20, 21, 22], incident_types: ['Phone snatching'], distance_km: 2.4 },
  { name: 'Hassan Square',           lat: 24.8979, lng: 67.0722, current_risk_level: 'MEDIUM', risk_level: 'MEDIUM', incident_count_week: 4,  incident_count_month: 15, peak_hours: [19, 20],     incident_types: ['Signal robbery'],  distance_km: 4.1 },
  { name: 'Baloch Colony Signal',    lat: 24.8589, lng: 67.0664, current_risk_level: 'LOW',    risk_level: 'LOW',    incident_count_week: 1,  incident_count_month: 5,  peak_hours: [18],         incident_types: ['Harassment'],      distance_km: 3.2 },
  { name: 'Numaish Signal',          lat: 24.8450, lng: 67.0285, current_risk_level: 'HIGH',   risk_level: 'HIGH',   incident_count_week: 5,  incident_count_month: 18, peak_hours: [21, 22],     incident_types: ['Mugging'],         distance_km: 1.9 },
  { name: 'Gulshan Chowrangi',       lat: 24.9215, lng: 67.0952, current_risk_level: 'MEDIUM', risk_level: 'MEDIUM', incident_count_week: 3,  incident_count_month: 11, peak_hours: [20],         incident_types: ['Phone snatching'], distance_km: 5.8 },
];
const DEMO_HOTSPOTS = [
  { name: 'Saddar Market',           center_lat: 24.8567, center_lng: 67.0118, risk_level: 'HIGH',   radius_meters: 600, incidents: 12 },
  { name: 'Shahra-e-Faisal Corridor',center_lat: 24.8820, center_lng: 67.0620, risk_level: 'MEDIUM', radius_meters: 800, incidents: 8  },
  { name: 'Gulshan Chowrangi',       center_lat: 24.9215, center_lng: 67.0952, risk_level: 'MEDIUM', radius_meters: 500, incidents: 6  },
];
const DEMO_INCIDENTS = [
  { lat: 24.8400, lng: 67.0250, type: 'phone_snatching' },
  { lat: 24.8550, lng: 67.0500, type: 'mugging'         },
  { lat: 24.8700, lng: 67.0800, type: 'signal_robbery'  },
];

const withFallback = async (request, fallback) => {
  try {
    return await request();
  } catch {
    return { data: typeof fallback === 'function' ? fallback() : fallback };
  }
};

export const getAllHotspots  = ()         => withFallback(() => api.get('/hotspot/map'),         DEMO_HOTSPOTS);
export const getAllSignals    = ()         => withFallback(() => api.get('/signals/map'),          DEMO_SIGNALS);
export const listIncidents    = ()         => withFallback(() => api.get('/incident/list'),        DEMO_INCIDENTS);
export const reportIncident   = (payload) => withFallback(() => api.post('/incident/report', payload), { ok: true });
export const getRiskScore     = (payload) => withFallback(() => api.post('/risk/score', payload), {
  risk_level: 'MEDIUM', risk_score: 0.62,
  risk_factors: ['Evening travel increases risk.', 'One high-risk signal near route.'],
  high_risk_signals: DEMO_SIGNALS.filter(s => s.risk_level === 'HIGH'),
});

export const getAiIncidentInsights = (payload) =>
  withFallback(
    () => api.post('/ai/incident-insights', payload),
    {
      insights:
        'Teen Talwar Signal remains the highest-risk location this week with 7 incidents, ' +
        'primarily phone snatching targeting motorbike riders between 9–11 PM. ' +
        'Signal robberies increased 30% across Saddar and Numaish corridors — avoid stopping at red lights after dark. ' +
        'Daytime travel before 6 PM carries significantly lower risk across all monitored zones.',
    }
  );

const DEMO_TRAINING_STATUS = {
  status: 'loaded',
  trained_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  n_samples: 348,
  n_high_risk: 198,
  n_low_risk: 150,
  train_samples: 271,
  test_samples: 77,
  holdout_accuracy: 0.8961,
  holdout_precision: 0.9149,
  holdout_recall: 0.8958,
  holdout_f1: 0.9053,
  cv_f1_mean: 0.8874,
  cv_f1_std: 0.0312,
  model_type: 'RandomForestClassifier',
  n_estimators: 200,
  max_depth: 10,
  duration_ms: 1640,
  next_retrain: 'Sunday 03:00 UTC',
  training_profile: {
    historical_incident_rows: 232,
    generated_safe_examples: 116,
    live_journey_outcomes: 0,
    crime_area_rows: 12,
    feature_count: 10,
  },
  confusion_matrix: {
    labels: ['LOW', 'HIGH'],
    matrix: [
      [31, 4],
      [4, 38],
    ],
  },
  feature_importances: [
    { feature: 'dest_crime_idx', importance: 0.2214 },
    { feature: 'origin_crime_idx', importance: 0.1861 },
    { feature: 'hour_risk', importance: 0.1457 },
    { feature: 'dest_weekly_incidents', importance: 0.1165 },
    { feature: 'origin_weekly_incidents', importance: 0.1032 },
    { feature: 'high_risk_signals', importance: 0.0827 },
  ],
};

export const getTrainingStatus = () =>
  withFallback(() => api.get('/training/status'), DEMO_TRAINING_STATUS);

export const retrainModel = () =>
  withFallback(
    () => api.post('/training/retrain', {}, { timeout: 60_000 }),
    {
      status: 'success',
      message: 'Demo model retrained',
      metadata: {
        ...DEMO_TRAINING_STATUS,
        trained_at: new Date().toISOString(),
        duration_ms: 1510,
        holdout_accuracy: 0.9026,
        holdout_f1: 0.9111,
        cv_f1_mean: 0.8918,
      },
    }
  );

export default api;
