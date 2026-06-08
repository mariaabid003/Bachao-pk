import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Easing, StatusBar,
} from 'react-native';
import { getAllSignals } from '../utils/api';
import { C } from '../theme';

const RISK_COLOR  = { HIGH: C.red,    MEDIUM: C.orange, LOW: C.green };
const RISK_BG     = { HIGH: C.redBg,  MEDIUM: C.orangeBg, LOW: C.greenBg };
const RISK_BORDER = {
  HIGH:   'rgba(239,68,68,0.3)',
  MEDIUM: 'rgba(245,158,11,0.3)',
  LOW:    'rgba(34,197,94,0.3)',
};
const RISK_ICON = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' };

const SIZE = 220;

function RadarSweep({ scanning }) {
  const rotate = useRef(new Animated.Value(0)).current;
  const ring1  = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!scanning) return;
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true, easing: Easing.linear })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring1, { toValue: 1.0, duration: 1200, useNativeDriver: true }),
        Animated.timing(ring1, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    return () => { rotate.stopAnimation(); ring1.stopAnimation(); };
  }, [scanning]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Static concentric rings */}
      {[1.0, 0.68, 0.38].map((scale, i) => (
        <View key={i} style={[rs.ring, {
          width: SIZE * scale, height: SIZE * scale,
          borderRadius: (SIZE * scale) / 2,
        }]} />
      ))}
      {/* Pulsing ring */}
      <Animated.View style={[rs.ring, {
        width: SIZE * 0.68, height: SIZE * 0.68,
        borderRadius: (SIZE * 0.68) / 2,
        borderColor: 'rgba(14,165,233,0.55)',
        opacity: ring1,
      }]} />

      {/* Sweep — use absoluteFill + rotation so transform-origin is the center */}
      {scanning && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
          <View style={{
            position: 'absolute',
            width: SIZE / 2 - 12,
            height: 2,
            backgroundColor: 'rgba(14,165,233,0.65)',
            top: SIZE / 2 - 1,
            left: SIZE / 2,
          }} />
        </Animated.View>
      )}

      {/* Center dot */}
      <View style={rs.dot} />

      {/* Label below */}
      <View style={{ position: 'absolute', bottom: -30, alignItems: 'center' }}>
        <Text style={rs.centerTxt}>{scanning ? 'SCANNING' : 'IDLE'}</Text>
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(14,165,233,0.18)', backgroundColor: 'transparent' },
  dot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: C.teal, position: 'absolute' },
  centerTxt: { color: C.teal, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },
});

export default function SafeSignals() {
  const [signals, setSignals]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    getAllSignals()
      .then(r => setSignals(r.data || []))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    HIGH:   signals.filter(s => s.current_risk_level === 'HIGH').length,
    MEDIUM: signals.filter(s => s.current_risk_level === 'MEDIUM').length,
    LOW:    signals.filter(s => s.current_risk_level === 'LOW').length,
  };
  const shown = filter === 'ALL' ? signals : signals.filter(s => s.current_risk_level === filter);
  const topAlert = signals.find(s => s.current_risk_level === 'HIGH') || signals.find(s => s.current_risk_level === 'MEDIUM');

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={s.header}>
        <Text style={s.appLabel}>SAFE SIGNALS</Text>
        <Text style={s.headerTitle}>Signal Scanner</Text>
      </View>

      {/* Radar */}
      <View style={s.radarSection}>
        <RadarSweep scanning={scanning} />

        {topAlert && (
          <View style={[s.alertBadge, { borderColor: RISK_BORDER[topAlert.current_risk_level] }]}>
            <Text style={s.alertBadgeTxt}>⚠ SIGNAL ALERT</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.alertBadgeName} numberOfLines={1}>{topAlert.name}</Text>
              <View style={[s.levelChip, { backgroundColor: RISK_BG[topAlert.current_risk_level], borderColor: RISK_BORDER[topAlert.current_risk_level] }]}>
                <Text style={[s.levelChipTxt, { color: RISK_COLOR[topAlert.current_risk_level] }]}>{topAlert.current_risk_level}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[s.scanBtn, scanning && s.scanBtnActive]}
          onPress={() => setScanning(v => !v)}>
          <Text style={[s.scanBtnTxt, scanning && { color: C.teal }]}>
            {scanning ? 'SCANNING...' : 'TAP TO SCAN'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {[
          { key: 'ALL',    label: 'ALL',  count: signals.length, color: C.text },
          { key: 'HIGH',   label: 'HIGH', count: counts.HIGH,    color: C.red   },
          { key: 'MEDIUM', label: 'MED',  count: counts.MEDIUM,  color: C.orange },
          { key: 'LOW',    label: 'SAFE', count: counts.LOW,     color: C.green  },
        ].map(({ key, label, count, color }) => (
          <TouchableOpacity key={key} style={[s.chip, filter === key && s.chipActive]} onPress={() => setFilter(key)}>
            <Text style={[s.chipCount, { color }]}>{count}</Text>
            <Text style={s.chipLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Signal list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        {loading ? (
          <Text style={s.loadingTxt}>Scanning for signals...</Text>
        ) : shown.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 32, gap: 8 }}>
            <Text style={{ fontSize: 32 }}>📡</Text>
            <Text style={s.loadingTxt}>No signals detected</Text>
          </View>
        ) : (
          shown.map((sig, i) => (
            <View key={i} style={[s.sigCard, { borderLeftColor: RISK_COLOR[sig.current_risk_level] }]}>
              <View style={[s.sigIcon, { backgroundColor: RISK_BG[sig.current_risk_level] }]}>
                <Text style={{ fontSize: 18 }}>{RISK_ICON[sig.current_risk_level]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sigName}>{sig.name}</Text>
                <Text style={s.sigMeta}>{sig.incident_count_week} incidents this week{sig.distance_km ? ' · ' + sig.distance_km + ' km' : ''}</Text>
              </View>
              <View style={[s.levelChip, { backgroundColor: RISK_BG[sig.current_risk_level], borderColor: RISK_BORDER[sig.current_risk_level] }]}>
                <Text style={[s.levelChipTxt, { color: RISK_COLOR[sig.current_risk_level] }]}>{sig.current_risk_level}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 },
  appLabel:     { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  headerTitle:  { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },

  radarSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 52, gap: 18 },

  alertBadge:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
                  borderWidth: 1, width: '88%',
                  shadowColor: '#0D1829', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  alertBadgeTxt:{ color: C.text, fontSize: 12, fontWeight: '700' },
  alertBadgeName:{ color: C.sub, fontSize: 13 },

  levelChip:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  levelChipTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  scanBtn:      { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
                  borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  scanBtnActive:{ borderColor: 'rgba(14,165,233,0.4)', backgroundColor: C.tealBg },
  scanBtnTxt:   { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },

  filterRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 16 },
  chip:         { flex: 1, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 10,
                  alignItems: 'center', borderWidth: 1, borderColor: C.border },
  chipActive:   { backgroundColor: C.surface2, borderColor: C.borderMed },
  chipCount:    { fontSize: 18, fontWeight: '800' },
  chipLabel:    { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  sigCard:      { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 10,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  borderLeftWidth: 3, borderWidth: 1, borderColor: C.border,
                  shadowColor: '#0D1829', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  sigIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sigName:      { color: C.text, fontSize: 14, fontWeight: '700' },
  sigMeta:      { color: C.muted, fontSize: 12, marginTop: 2 },

  loadingTxt:   { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 32 },
});
