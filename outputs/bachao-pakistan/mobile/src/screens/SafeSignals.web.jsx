import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { getAllSignals } from '../utils/api';

const T = {
  bg:      '#F5F7FF', surface: '#FFFFFF', surface2: '#EEF1F9',
  nav:     '#080D1A', border:  'rgba(15,23,42,0.08)',
  text:    '#0D1829', sub:     '#475569', muted:    '#94A3B8',
  red:     '#EF4444', redBg:   'rgba(239,68,68,0.09)', redBorder: 'rgba(239,68,68,0.25)',
  orange:  '#F59E0B', orangeBg:'rgba(245,158,11,0.09)',
  green:   '#22C55E', greenBg: 'rgba(34,197,94,0.09)',
  teal:    '#0EA5E9', tealBg:  'rgba(14,165,233,0.09)',
};
const RISK_CLR    = { HIGH: T.red,    MEDIUM: T.orange, LOW: T.green };
const RISK_BG     = { HIGH: T.redBg,  MEDIUM: T.orangeBg, LOW: T.greenBg };
const RISK_BORDER = { HIGH: T.redBorder, MEDIUM: 'rgba(245,158,11,0.25)', LOW: 'rgba(34,197,94,0.25)' };
const RISK_ICONS  = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' };

export default function SafeSignals({ navigation }) {
  const { width }                     = useWindowDimensions();
  const [signals, setSignals]         = useState([]);
  const [selected, setSelected]       = useState(null);
  const [filter, setFilter]           = useState('ALL');
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    getAllSignals().then(r => setSignals(r.data || [])).catch(console.warn).finally(() => setLoading(false));
  }, []);

  const filtered = signals.filter(s => filter === 'ALL' || s.current_risk_level === filter);
  const counts   = { HIGH: signals.filter(s => s.current_risk_level === 'HIGH').length,
                     MEDIUM: signals.filter(s => s.current_risk_level === 'MEDIUM').length,
                     LOW: signals.filter(s => s.current_risk_level === 'LOW').length };
  const isNarrow = width < 720;

  if (loading) return (
    <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: 32 }}>📡</Text>
      <Text style={[s.muted, { marginTop: 12 }]}>Scanning for signals...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={s.appLabel}>SAFE SIGNALS</Text>
        <Text style={s.title}>Signal Risk Map — Karachi</Text>
      </View>

      <View style={s.statsBar}>
        {[
          { n: counts.HIGH,   label: 'HIGH RISK', color: T.red    },
          { n: counts.MEDIUM, label: 'MEDIUM',     color: T.orange  },
          { n: counts.LOW,    label: 'SAFE',        color: T.green   },
        ].map((st, i) => (
          <View key={i} style={s.statItem}>
            <Text style={[s.statNum, { color: st.color }]}>{st.n}</Text>
            <Text style={s.muted}>{st.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.filters}>
        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
          <TouchableOpacity key={f} style={[s.chip, filter === f && s.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[s.chipTxt, filter === f && s.chipTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.body, isNarrow && { flexDirection: 'column' }]}>
        <View style={[s.mapBox, isNarrow && { height: 240, flex: 0 }]}>
          <iframe
            title="Karachi Signals Map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=66.9%2C24.78%2C67.15%2C24.94&layer=mapnik"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
          />
        </View>
        <ScrollView style={s.listPanel}>
          <Text style={s.listTitle}>{filtered.length} signals</Text>
          {filtered.map((sig, i) => (
            <TouchableOpacity key={i}
              style={[s.sigCard, { borderLeftColor: RISK_CLR[sig.current_risk_level] },
                      selected?.name === sig.name && { borderColor: RISK_BORDER[sig.current_risk_level] }]}
              onPress={() => setSelected(selected?.name === sig.name ? null : sig)}>
              <Text style={{ fontSize: 18 }}>{RISK_ICONS[sig.current_risk_level]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.sigName}>{sig.name}</Text>
                <Text style={s.muted}>{sig.incident_count_week} incidents/wk</Text>
              </View>
              <View style={[s.badge, { backgroundColor: RISK_BG[sig.current_risk_level], borderColor: RISK_BORDER[sig.current_risk_level] }]}>
                <Text style={[s.badgeTxt, { color: RISK_CLR[sig.current_risk_level] }]}>{sig.current_risk_level}</Text>
              </View>
              {selected?.name === sig.name && (
                <View style={s.detail}>
                  {sig.peak_hours?.length > 0 && <Text style={s.muted}>Peak: {sig.peak_hours.join('h, ')}h</Text>}
                  {sig.incident_types?.[0] && <Text style={s.muted}>Common: {sig.incident_types[0]}</Text>}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.bg },
  header:     { padding: 24, paddingTop: 56 },
  appLabel:   { color: T.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  title:      { color: T.text, fontSize: 22, fontWeight: '800' },
  backBtn:    { marginBottom: 8 },
  backTxt:    { color: T.sub, fontSize: 14 },
  muted:      { color: T.muted, fontSize: 12 },

  statsBar:   { flexDirection: 'row', backgroundColor: T.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: T.border },
  statItem:   { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statNum:    { fontSize: 26, fontWeight: '800', marginBottom: 2 },

  filters:    { flexDirection: 'row', padding: 16, gap: 8 },
  chip:       { backgroundColor: T.surface, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
                borderWidth: 1, borderColor: T.border },
  chipActive: { backgroundColor: T.surface2, borderColor: 'rgba(15,23,42,0.14)' },
  chipTxt:    { color: T.muted, fontSize: 13, fontWeight: '600' },
  chipTxtActive:{ color: T.text, fontWeight: '700' },

  body:       { flex: 1, flexDirection: 'row', overflow: 'hidden' },
  mapBox:     { flex: 1, margin: 16, borderRadius: 12, overflow: 'hidden', minHeight: 300,
                borderWidth: 1, borderColor: T.border },
  listPanel:  { width: 300, backgroundColor: T.surface, borderLeftWidth: 1, borderLeftColor: T.border, padding: 16 },
  listTitle:  { color: T.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase' },

  sigCard:    { backgroundColor: T.surface, borderRadius: 12, padding: 12, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', gap: 10,
                borderLeftWidth: 3, borderWidth: 1, borderColor: T.border },
  sigName:    { color: T.text, fontSize: 13, fontWeight: '600' },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeTxt:   { fontSize: 10, fontWeight: '800' },
  detail:     { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: T.border, gap: 4 },
});
