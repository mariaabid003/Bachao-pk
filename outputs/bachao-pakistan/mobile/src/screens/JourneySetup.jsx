import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { getRiskScore, startJourney, getAiRiskAnalysis, getAiSosMessage } from '../utils/api';
import { DEMO_LOCATION, TRAVEL_MODES } from '../utils/constants';
import { C } from '../theme';
import LocationSearch, { reverseGeocode } from '../components/LocationSearch';

export default function JourneySetup({ route, navigation }) {
  const initialMode = route.params?.travelMode || 'solo';
  const [travelMode, setMode]     = useState(initialMode);
  const [origin, setOrigin]       = useState(null);
  const [destination, setDest]    = useState(null);
  const [originLabel, setOLabel]  = useState('');
  const [loading, setLoading]     = useState(false);
  const [locating, setLocating]   = useState(true);

  // Auto-fill pickup with current location on mount
  useEffect(() => {
    (async () => {
      setLocating(true);
      try {
        if (Platform.OS !== 'web') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = loc.coords;
            const label = await reverseGeocode(latitude, longitude);
            setOrigin({ lat: latitude, lng: longitude, label });
            setOLabel(label);
            setLocating(false);
            return;
          }
        }
      } catch (e) { console.warn('Location:', e.message); }
      // Web / permission denied fallback
      const label = 'Karachi (Demo Location)';
      setOrigin({ lat: DEMO_LOCATION.latitude, lng: DEMO_LOCATION.longitude, label });
      setOLabel(label);
      setLocating(false);
    })();
  }, []);

  const handleConfirm = async () => {
    if (!origin) return;
    setLoading(true);
    try {
      const oLat = origin.lat, oLng = origin.lng;
      const dLat = destination?.lat ?? 24.8607;
      const dLng = destination?.lng ?? 67.0104;
      const now     = new Date();
      const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      const days    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

      const riskResp = await getRiskScore({
        origin_lat: oLat, origin_lng: oLng,
        destination_lat: dLat, destination_lng: dLng,
        time_of_day: timeStr, day_of_week: days[now.getDay()], journey_type: travelMode,
      });

      const userId   = getAuth().currentUser?.uid || 'demo-user';
      let userData   = { name: 'User', contacts: [{ name: 'Trusted Contact', phone: '+923001234567' }] };
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) userData = snap.data();
      } catch (e) { console.warn('Contact load:', e.message); }
      const contact = userData.contacts?.[0] || {};

      const journeyResp = await startJourney({
        user_id: userId, origin_lat: oLat, origin_lng: oLng,
        destination_lat: dLat, destination_lng: dLng,
        contact_phone: contact.phone || '', contact_name: contact.name || '',
        risk_level: riskResp.data.risk_level, journey_type: travelMode, plate_number: null,
      });

      const firstSignal = riskResp.data.high_risk_signals?.[0];
      const [aiAnalysisResp, aiSosResp] = await Promise.all([
        getAiRiskAnalysis({
          journey_type: travelMode, time_of_day: timeStr, day_of_week: days[now.getDay()],
          risk_level: riskResp.data.risk_level, risk_score: riskResp.data.risk_score,
          high_risk_signals: riskResp.data.high_risk_signals || [],
        }),
        getAiSosMessage({
          name: userData?.name || 'User',
          signal_name: firstSignal?.name || firstSignal?.signal_name || 'Karachi',
          lat: oLat, lng: oLng, time: timeStr, journey_type: travelMode,
        }),
      ]);

      navigation.navigate('RiskResult', {
        riskResult: riskResp.data, journeyData: journeyResp.data, travelMode,
        aiAnalysis: aiAnalysisResp.data.analysis, aiSosMessage: aiSosResp.data.message,
        originLabel: originLabel, destLabel: destination?.label || 'Destination',
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Plan Journey</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={s.content}>
          {/* Travel Mode */}
          <Text style={s.lbl}>TRAVEL MODE</Text>
          <View style={s.modeGrid}>
            {TRAVEL_MODES.map(m => (
              <TouchableOpacity key={m.id} style={[s.modeCard, travelMode === m.id && s.modeCardActive]}
                onPress={() => setMode(m.id)}>
                <Text style={s.modeEmoji}>{m.icon}</Text>
                <Text style={[s.modeTxt, travelMode === m.id && s.modeTxtActive]}>{m.label}</Text>
                {travelMode === m.id && <View style={s.modeDot} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Pickup */}
          <Text style={s.lbl}>PICKUP LOCATION</Text>
          {locating ? (
            <View style={s.locatingRow}>
              <ActivityIndicator size="small" color={C.green} />
              <Text style={s.locatingTxt}>Getting your location…</Text>
            </View>
          ) : (
            <LocationSearch
              placeholder="Where are you starting from?"
              value={originLabel}
              icon="🟢"
              onSelect={(loc) => {
                if (loc) { setOrigin(loc); setOLabel(loc.label); }
              }}
            />
          )}

          {/* Destination */}
          <Text style={[s.lbl, { marginTop: 16 }]}>DESTINATION</Text>
          <LocationSearch
            placeholder="Where are you going?"
            icon="🔴"
            onSelect={(loc) => setDest(loc)}
          />
          <Text style={s.hint}>Leave blank to use your current area</Text>

          {/* AI Info */}
          <View style={s.infoCard}>
            <Text style={s.infoIcon}>🤖</Text>
            <Text style={s.infoTxt}>Claude AI will analyse your route and generate a personalised safety brief</Text>
          </View>

          <TouchableOpacity style={[s.btn, (loading || locating) && s.btnDisabled]}
            onPress={handleConfirm} disabled={loading || locating}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>ANALYSE ROUTE →</Text>
            }
          </TouchableOpacity>
          {loading && <Text style={s.loadingNote}>Analysing risk + generating AI brief…</Text>}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: 20, paddingTop: 52, paddingBottom: 8 },
  backBtn:       { paddingVertical: 8, paddingHorizontal: 4 },
  backTxt:       { color: C.sub, fontSize: 15 },
  headerTitle:   { color: C.text, fontSize: 17, fontWeight: '700' },
  content:       { padding: 20 },
  lbl:           { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  modeGrid:      { flexDirection: 'row', gap: 10, marginBottom: 8 },
  modeCard:      { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14,
                   alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border },
  modeCardActive:{ borderColor: C.red, backgroundColor: 'rgba(239,68,68,0.08)' },
  modeEmoji:     { fontSize: 24 },
  modeTxt:       { color: C.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  modeTxtActive: { color: C.text },
  modeDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  locatingRow:   { flexDirection: 'row', alignItems: 'center', gap: 10,
                   backgroundColor: C.surface, borderRadius: 14, padding: 15,
                   borderWidth: 1, borderColor: C.border },
  locatingTxt:   { color: C.sub, fontSize: 14 },
  hint:          { color: C.muted, fontSize: 12, marginTop: 6, marginBottom: 4 },
  infoCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#160D2F',
                   borderRadius: 14, padding: 14, marginTop: 16, gap: 12,
                   borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  infoIcon:      { fontSize: 20 },
  infoTxt:       { color: '#A78BFA', fontSize: 13, flex: 1, lineHeight: 20 },
  btn:           { backgroundColor: C.red, borderRadius: 16, paddingVertical: 18,
                   alignItems: 'center', marginTop: 20 },
  btnDisabled:   { opacity: 0.5 },
  btnTxt:        { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.8 },
  loadingNote:   { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
