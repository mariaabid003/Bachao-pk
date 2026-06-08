import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { SHAKE_THRESHOLD, SHAKE_WINDOW_MS } from '../utils/constants';

/**
 * Invisible component. Listens for 3 shakes within SHAKE_WINDOW_MS.
 * Calls onShake() when triggered.
 */
export default function ShakeDetector({ onShake }) {
  const shakeTimes = useRef([]);
  const subscription = useRef(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    subscription.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > SHAKE_THRESHOLD) {
        const now = Date.now();
        shakeTimes.current = [...shakeTimes.current, now].filter(
          t => now - t < SHAKE_WINDOW_MS
        );
        if (shakeTimes.current.length >= 3) {
          shakeTimes.current = [];
          onShake?.();
        }
      }
    });

    return () => subscription.current?.remove();
  }, []);

  return null;
}
