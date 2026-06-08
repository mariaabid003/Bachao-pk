import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { pingJourney } from '../utils/api';
import { GPS_POLL_INTERVAL_MS } from '../utils/constants';

/**
 * Invisible component. Polls GPS every GPS_POLL_INTERVAL_MS and
 * calls POST /journey/ping. Passes response to onPingResponse.
 */
export default function LocationPoller({ journeyId, onLocation, onPingResponse }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude, speed } = loc.coords;
        onLocation?.({ latitude, longitude });

        const resp = await pingJourney({
          journey_id: journeyId,
          current_lat: latitude,
          current_lng: longitude,
          current_speed: (speed || 0) * 3.6, // m/s → km/h
          timestamp: new Date().toISOString(),
        });
        onPingResponse?.(resp.data);
      } catch (e) {
        console.warn('Location poll error:', e.message);
      }
    };

    poll(); // immediate first ping
    intervalRef.current = setInterval(poll, GPS_POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [journeyId]);

  return null;
}
