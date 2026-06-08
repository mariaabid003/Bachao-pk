import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { C } from '../theme';

/**
 * TimerRing — animated SVG countdown ring
 * Props: timeLeft (seconds), total (seconds), color (optional), size (optional)
 */
export default function TimerRing({ timeLeft, total, color, size = 200 }) {
  const STROKE = 10;
  const R      = (size - STROKE) / 2;
  const CIRC   = 2 * Math.PI * R;
  const pct    = Math.max((timeLeft || 0) / (total || 1), 0);
  const offset = CIRC * (1 - pct);

  const ringColor = color || (pct > 0.5 ? C.green : pct > 0.25 ? C.orange : C.red);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2} cy={size / 2} r={R}
          stroke="rgba(15,23,42,0.07)"
          strokeWidth={STROKE} fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2} cy={size / 2} r={R}
          stroke={ringColor}
          strokeWidth={STROKE} fill="none"
          strokeDasharray={CIRC + ' ' + CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={size / 2 + ',' + size / 2}
        />
      </Svg>
    </View>
  );
}
