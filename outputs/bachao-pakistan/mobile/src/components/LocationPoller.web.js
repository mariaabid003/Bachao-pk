import { useEffect, useRef } from 'react';
import { pingJourney } from '../utils/api';
import { DEMO_LOCATION, GPS_POLL_INTERVAL_MS } from '../utils/constants';

/**
 * LocationPoller.web.js — Web version using browser navigator.geolocation
 *
 * Replaces expo-location (native only) with the standard browser Geolocation API.
 * Metro automatically uses this file over LocationPoller.js on web.
 */
export default function LocationPoller({ journeyId, onLocation, onPingResponse }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    const pingWithCoords = async (coords) => {
      onLocation?.(coords);
      try {
        const resp = await pingJourney({
          journey_id: journeyId,
          current_lat: coords.latitude,
          current_lng: coords.longitude,
          current_speed: 0,
          timestamp: new Date().toISOString(),
        });
        onPingResponse?.(resp.data);
      } catch (e) {
        console.warn('Ping error:', e.message);
      }
    };

    if (!navigator.geolocation) {
      console.warn('Geolocation not supported in this browser');
      pingWithCoords(DEMO_LOCATION);
      return;
    }

    const poll = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, speed } = position.coords;
          onLocation?.({ latitude, longitude });

          try {
            const resp = await pingJourney({
              journey_id: journeyId,
              current_lat: latitude,
              current_lng: longitude,
              current_speed: (speed || 0) * 3.6, // m/s → km/h
              timestamp: new Date().toISOString(),
            });
            onPingResponse?.(resp.data);
          } catch (e) {
            console.warn('Ping error:', e.message);
          }
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          pingWithCoords(DEMO_LOCATION);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    poll(); // immediate first ping
    intervalRef.current = setInterval(poll, GPS_POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [journeyId]);

  return null;
}
