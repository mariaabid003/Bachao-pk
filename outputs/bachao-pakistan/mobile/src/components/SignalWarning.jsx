import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SIGNAL_WARNING_DURATION_MS } from '../utils/constants';

/**
 * Signal warning overlay — shown when biker is 200m from a high-risk signal.
 * Auto-dismisses after SIGNAL_WARNING_DURATION_MS.
 * Does NOT make sound.
 */
export default function SignalWarning({ signal, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, SIGNAL_WARNING_DURATION_MS);
    return () => clearTimeout(t);
  }, [signal]);

  if (!signal) return null;

  return (
    <View style={s.overlay}>
      <View style={s.card}>
        <Text style={s.icon}>⚠️</Text>
        <Text style={s.title}>HIGH-RISK SIGNAL AHEAD</Text>
        <Text style={s.name}>{signal.name} — {signal.distance_meters}m</Text>
        <Text style={s.incidents}>{signal.incident_count_week} snatching reports this week</Text>
        {signal.peak_hours?.length > 0 && (
          <Text style={s.peak}>Peak time: {signal.peak_hours[0]}PM–{signal.peak_hours[signal.peak_hours.length - 1] + 1}AM</Text>
        )}
        <Text style={s.advice}>Keep phone hidden. Stay alert.</Text>
        <TouchableOpacity style={s.btn} onPress={onDismiss}>
          <Text style={s.btnText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  card:      { backgroundColor: '#1e293b', borderRadius: 20, padding: 28, width: '85%', borderWidth: 2, borderColor: '#ef4444', alignItems: 'center' },
  icon:      { fontSize: 40, marginBottom: 8 },
  title:     { color: '#ef4444', fontSize: 16, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  name:      { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  incidents: { color: '#fca5a5', fontSize: 14, marginTop: 6 },
  peak:      { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  advice:    { color: '#f59e0b', fontSize: 15, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  btn:       { marginTop: 20, backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 40 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
