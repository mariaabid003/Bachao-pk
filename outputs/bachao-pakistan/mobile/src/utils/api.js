import axios from 'axios';
import { API_BASE_URL } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5_000,
});

const DEMO_SIGNALS = [
  {
    name: 'Teen Talwar Signal',
    lat: 24.8305,
    lng: 67.0333,
    current_risk_level: 'HIGH',
    incident_count_week: 7,
    incident_count_month: 24,
    peak_hours: [20, 21, 22],
    incident_types: ['Phone snatching'],
    distance_km: 2.4,
  },
  {
    name: 'Hassan Square',
    lat: 24.8979,
    lng: 67.0722,
    current_risk_level: 'MEDIUM',
    incident_count_week: 4,
    incident_count_month: 15,
    peak_hours: [19, 20],
    incident_types: ['Signal robbery'],
    distance_km: 4.1,
  },
  {
    name: 'Baloch Colony Signal',
    lat: 24.8589,
    lng: 67.0664,
    current_risk_level: 'LOW',
    incident_count_week: 1,
    incident_count_month: 5,
    peak_hours: [18],
    incident_types: ['Harassment'],
    distance_km: 3.2,
  },
];

const DEMO_HOTSPOTS = [
  { name: 'Saddar Market', risk_level: 'HIGH', incidents: 12, distance_km: 1.8 },
  { name: 'Shahra-e-Faisal Corridor', risk_level: 'MEDIUM', incidents: 8, distance_km: 2.9 },
  { name: 'Gulshan Chowrangi', risk_level: 'MEDIUM', incidents: 6, distance_km: 4.6 },
];

const demoRouteSignals = () =>
  DEMO_SIGNALS
    .filter(s => s.current_risk_level === 'HIGH')
    .map(s => ({
      ...s,
      signal_name: s.name,
      weekly_incidents: s.incident_count_week,
      peak_hours: Array.isArray(s.peak_hours) ? s.peak_hours.map(h => `${h}h`).join(', ') : s.peak_hours,
    }));

const response = (data) => Promise.resolve({ data });

const withDemoFallback = async (request, fallback, label) => {
  try {
    return await request();
  } catch (e) {
    console.warn(`${label} unavailable; using demo data`, e.message);
    return response(typeof fallback === 'function' ? fallback() : fallback);
  }
};

export const getRiskScore = (payload) =>
  withDemoFallback(
    () => api.post('/risk/score', payload),
    {
      risk_level: 'MEDIUM',
      risk_score: 0.62,
      risk_factors: [
        'Evening travel increases reported incident risk on this corridor.',
        'One high-risk signal appears near the selected route.',
        'Recent biker phone-snatching reports are elevated nearby.',
      ],
      high_risk_signals: demoRouteSignals(),
    },
    'Risk score'
  );

export const startJourney = (payload) =>
  withDemoFallback(
    () => api.post('/journey/start', payload),
    {
      journey_id: `demo-${Date.now()}`,
      timer_duration_seconds: 300,
      expected_arrival: '12 minutes',
      signals_on_route: demoRouteSignals(),
    },
    'Journey start'
  );

export const pingJourney = (payload) =>
  withDemoFallback(
    () => api.post('/journey/ping', payload),
    { status: 'ok', message: 'Route looks normal' },
    'Journey ping'
  );

export const endJourney = (journey_id) =>
  withDemoFallback(
    () => api.post('/journey/end', { journey_id }),
    { ok: true },
    'Journey end'
  );

export const triggerAlert = (payload) =>
  withDemoFallback(
    () => api.post('/alerts/trigger', payload),
    { ok: true, alert_id: `demo-alert-${Date.now()}` },
    'Alert trigger'
  );

export const getNearbyHotspots = (lat, lng) =>
  withDemoFallback(
    () => api.get('/hotspot/nearby', { params: { lat, lng } }),
    DEMO_HOTSPOTS,
    'Nearby hotspots'
  );

export const getNearbySignals = (lat, lng) =>
  withDemoFallback(
    () => api.get('/signals/nearby', { params: { lat, lng } }),
    DEMO_SIGNALS,
    'Nearby signals'
  );

export const getAllSignals = () =>
  withDemoFallback(
    () => api.get('/signals/map'),
    DEMO_SIGNALS,
    'Signal map'
  );

export const reportIncident = (payload) =>
  withDemoFallback(
    () => api.post('/incident/report', payload),
    { ok: true, incident_id: `demo-incident-${Date.now()}` },
    'Incident report'
  );

// ── AI features ──────────────────────────────────────────────────────────────

export const getAiRiskAnalysis = (payload) =>
  withDemoFallback(
    () => api.post('/ai/risk-analysis', payload),
    {
      analysis:
        'Teen Talwar Signal has seen 7 robberies this week, peaking between 9–11 PM. ' +
        'For this travel mode at this hour, keep your phone secured and avoid stopping at red lights unnecessarily.',
    },
    'AI risk analysis'
  );

export const getAiSosMessage = (payload) =>
  withDemoFallback(
    () => api.post('/ai/sos-message', payload),
    {
      message:
        `🚨 SOS: ${payload.name || 'User'} triggered an emergency alert near ${payload.signal_name || 'Teen Talwar Signal'}, Karachi at ${payload.time || 'unknown time'}. ` +
        `Last GPS: https://maps.google.com/?q=${payload.lat || '24.8607'},${payload.lng || '67.0104'}. Please call immediately.`,
    },
    'AI SOS message'
  );

export const registerUser = (payload) =>
  withDemoFallback(
    () => api.post('/user/register', payload),
    { status: 'registered', sms_sent: false, message: `Welcome ${payload.name}! You're now protected by Bachao.` },
    'User registration'
  );

export default api;
