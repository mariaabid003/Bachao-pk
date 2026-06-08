import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { getNearbyHotspots, getNearbySignals } from '../utils/api';
import { DEMO_LOCATION, TRAVEL_MODES, RISK_COLORS } from '../utils/constants';
import { C, card, shadow } from '../theme';
import RiskBadge from '../components/RiskBadge';

const RISK_DOT = { HIGH: C.red, MEDIUM: C.orange, LOW: C.green };

export default function Home({ navigation }) {
  const [user, setUser]         = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [signals, setSignals]   = useState([]);
  const [travelMode, setMode]   = useState('solo');

  useEffect(() => { loadUser(); requestLocation(); }, []);

  const loadUser = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', getAuth().currentUser?.uid || 'demo-user'));
      if (snap.exists()) { const d = snap.data(); setUser(d); setMode(d.travel_mode || 'solo'); return; }
    } catch (e) { console.warn('Profile load:', e.message); }
    setUser({ name: 'Maria', travel_mode: 'solo' });
  };

  const requestLocation = async () => {
    if (Platform.OS === 'web') { fetchNearby(DEMO_LOCATION.latitude, DEMO_LOCATION.longitude); return; }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        fetchNearby(loc.coords.latitude, loc.coords.longitude); return;
      }
    } catch (e) { console.warn('Location:', e.message); }
    fetchNearby(DEMO_LOCATION.latitude, DEMO_LOCATION.longitude);
  };

  const fetchNearby = async (lat, lng) => {
    try {
      const [hs, sigs] = await Promise.all([getNearbyHotspots(lat, lng), getNearbySignals(lat, lng)]);
      setHotspots(hs.data || []); setSignals(sigs.data || []);
    } catch (e) { console.warn('Fetch nearby:', e.message); }
  };

  const high   = signals.filter(s => s.current_risk_level === 'HIGH').length;
  const medium = signals.filter(s => s.current_risk_level === 'MEDIUM').length;
  const safe   = signals.filter(s => s.current_risk_level === 'LOW').length;
  const hour   = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.appLabel}>SAFE PAKISTAN</Text>
            <Text style={s.greeting}>{greeting}, <Text style={s.name}>{user?.name?.split(' ')[0] || 'there'}</Text></Text>
          </View>
          <View style={s.shieldBtn}>
            <Text style={{ fontSize: 22 }}>🛡️</Text>
          </View>
        </View>

        {/* ── Threat summary ── */}
        <View style={s.threatCard}>
          <Text style={s.threatTitle}>AREA THREAT LEVEL</Text>
          <View style={s.threatRow}>
            {[
              { count: high,   color: C.red,    label: 'HIGH' },
              { count: medium, color: C.orange,  label: 'MED' },
              { count: safe,   color: C.green,   label: 'SAFE' },
            ].map(({ count, color, label }) => (
              <View key={label} style={s.threatItem}>
                <View style={[s.threatDot, { backgroundColor: color }]} />
                <Text style={[s.threatCount, { color }]}>{count}</Text>
                <Text style={s.threatLabel}>{label}</Text>
              </View>
            ))}
          </View>
          {hotspots.length > 0 && (
            <View style={s.hotspotPill}>
              <Text style={s.hotspotTxt}>📍 {hotspots.length} active crime zones within 5 km</Text>
            </View>
          )}
        </View>

        {/* ── Biker alert ── */}
        {travelMode === 'biker' && high > 0 && (
          <View style={s.bikerAlert}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <Text style={s.bikerTxt}>{high} high-risk signal{high > 1 ? 's' : ''} on common biker routes tonight</Text>
          </View>
        )}

        {/* ── Travel mode ── */}
        <View style={s.section}>
          <Text style={s.sectionLbl}>TRAVEL MODE</Text>
          <View style={s.modeRow}>
            {TRAVEL_MODES.map(m => {
              const active = travelMode === m.id;
              return (
                <TouchableOpacity key={m.id} style={[s.modeChip, active && s.modeChipActive]}
                  onPress={() => setMode(m.id)}>
                  <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                  <Text style={[s.modeLabel, active && s.modeLabelActive]}>
                    {m.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Primary CTA ── */}
        <View style={s.ctaWrap}>
          <TouchableOpacity style={s.startBtn}
            onPress={() => navigation.navigate('JourneySetup', { travelMode })}>
            <View style={s.startIconWrap}><Text style={{ fontSize: 26 }}>🗺️</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.startTitle}>Start Journey</Text>
              <Text style={s.startSub}>AI-powered route risk analysis</Text>
            </View>
            <Text style={s.startArrow}>→</Text>
          </TouchableOpacity>

          <View style={s.miniRow}>
            {travelMode === 'biker' && (
              <TouchableOpacity style={[s.miniBtn, { borderColor: C.orangeBg }]}
                onPress={() => navigation.navigate('SafeSignals')}>
                <Text style={{ fontSize: 18 }}>🚦</Text>
                <Text style={[s.miniBtnTxt, { color: C.orange }]}>Safe Signals</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.miniBtn, { flex: travelMode === 'biker' ? 1 : undefined, width: travelMode === 'biker' ? undefined : '100%' }]}
              onPress={() => navigation.navigate('IncidentReport')}>
              <Text style={{ fontSize: 18 }}>📋</Text>
              <Text style={s.miniBtnTxt}>Report Incident</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Nearby signals ── */}
        {signals.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLbl}>NEARBY SIGNALS</Text>
            {signals.slice(0, 4).map((sig, i) => (
              <View key={i} style={[s.signalCard, { borderLeftColor: RISK_COLORS[sig.current_risk_level] }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sigName}>{sig.name}</Text>
                  <Text style={s.sigMeta}>{sig.incident_count_week} incidents this week · {sig.distance_km} km away</Text>
                </View>
                <RiskBadge level={sig.current_risk_level} />
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
                   paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 },
  appLabel:      { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  greeting:      { color: C.sub, fontSize: 16 },
  name:          { color: C.text, fontWeight: '800' },
  shieldBtn:     { width: 46, height: 46, borderRadius: 14, backgroundColor: C.surface,
                   alignItems: 'center', justifyContent: 'center',
                   borderWidth: 1, borderColor: C.border,
                   shadowColor: '#0D1829', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },

  // Threat card
  threatCard:    { marginHorizontal: 24, backgroundColor: C.surface, borderRadius: 20,
                   padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border,
                   shadowColor: '#0D1829', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  threatTitle:   { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.0, marginBottom: 14 },
  threatRow:     { flexDirection: 'row', gap: 20 },
  threatItem:    { alignItems: 'center', gap: 4 },
  threatDot:     { width: 10, height: 10, borderRadius: 5 },
  threatCount:   { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  threatLabel:   { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  hotspotPill:   { marginTop: 14, backgroundColor: C.surface2, borderRadius: 10,
                   paddingHorizontal: 12, paddingVertical: 8 },
  hotspotTxt:    { color: C.sub, fontSize: 12 },

  // Biker alert
  bikerAlert:    { flexDirection: 'row', alignItems: 'center', gap: 10,
                   marginHorizontal: 24, marginBottom: 16, borderRadius: 14,
                   backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redBorder,
                   padding: 14 },
  bikerTxt:      { color: C.red, fontSize: 13, flex: 1, lineHeight: 18 },

  // Sections
  section:       { paddingHorizontal: 24, marginBottom: 18 },
  sectionLbl:    { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.0, marginBottom: 12 },

  // Mode chips
  modeRow:       { flexDirection: 'row', gap: 10 },
  modeChip:      { flex: 1, backgroundColor: C.surface, borderRadius: 16, paddingVertical: 14,
                   alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border },
  modeChipActive:{ backgroundColor: C.surface2, borderColor: C.borderMed },
  modeLabel:     { color: C.muted, fontSize: 11, fontWeight: '600' },
  modeLabelActive:{ color: C.text },

  // CTA
  ctaWrap:       { paddingHorizontal: 24, gap: 10, marginBottom: 20 },
  startBtn:      { backgroundColor: C.text, borderRadius: 20, padding: 20,
                   flexDirection: 'row', alignItems: 'center', gap: 14 },
  startIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)',
                   alignItems: 'center', justifyContent: 'center' },
  startTitle:    { color: '#fff', fontSize: 17, fontWeight: '700' },
  startSub:      { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  startArrow:    { color: 'rgba(255,255,255,0.5)', fontSize: 22 },
  miniRow:       { flexDirection: 'row', gap: 10 },
  miniBtn:       { flex: 1, backgroundColor: C.surface, borderRadius: 16, paddingVertical: 16,
                   flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   gap: 8, borderWidth: 1, borderColor: C.border },
  miniBtnTxt:    { color: C.sub, fontSize: 13, fontWeight: '600' },

  // Signal cards
  signalCard:    { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8,
                   flexDirection: 'row', alignItems: 'center',
                   borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  sigName:       { color: C.text, fontSize: 14, fontWeight: '600' },
  sigMeta:       { color: C.muted, fontSize: 12, marginTop: 2 },
});
