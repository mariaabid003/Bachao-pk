import { Platform } from 'react-native';

function getApiBaseUrl() {
  const envUrl = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : undefined;
  if (envUrl) return envUrl;
  if (Platform.OS === 'web') return 'http://localhost:8000';
  // Auto-detect host from expo-constants (safe lazy import)
  try {
    const Constants = require('expo-constants').default;
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost') return `http://${host}:8000`;
    }
  } catch (e) { /* expo-constants unavailable */ }
  // ← UPDATE THIS to your PC's WiFi IP if auto-detect fails
  return 'http://192.168.18.187:8000';
}

export const API_BASE_URL = getApiBaseUrl();

export const DEMO_LOCATION = {
  latitude: 24.8607,
  longitude: 67.0104,
};

export const TRAVEL_MODES = [
  { id: 'ride_hailing', label: 'Ride-Hailing', icon: '🚗' },
  { id: 'solo',         label: 'Solo Traveller', icon: '🚶' },
  { id: 'biker',        label: 'Biker',          icon: '🏍️' },
];

export const INCIDENT_TYPES = [
  { id: 'phone_snatching', label: 'Phone Snatching (Biker)', icon: '🏍️' },
  { id: 'ride_hailing',    label: 'Ride-Hailing Incident',   icon: '🚗' },
  { id: 'mugging',         label: 'Street Mugging (Armed)',   icon: '👊' },
  { id: 'signal_robbery',  label: 'Signal Robbery',          icon: '🚦' },
  { id: 'harassment',      label: 'Harassment',              icon: '😰' },
  { id: 'other',           label: 'Other',                   icon: '📋' },
];

export const RISK_COLORS = {
  HIGH:   '#ef4444',
  MEDIUM: '#f59e0b',
  LOW:    '#22c55e',
};

export const GPS_POLL_INTERVAL_MS = 30_000; // 30 seconds
export const SHAKE_THRESHOLD = 2.5;         // g-force threshold
export const SHAKE_WINDOW_MS = 2_000;       // 3 shakes within this window
export const SIGNAL_WARNING_DURATION_MS = 8_000;
