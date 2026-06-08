import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Vibration, Alert, Platform, Animated, Easing, StatusBar,
} from 'react-native';
import { pingJourney, endJourney, triggerAlert } from '../utils/api';
import { DEMO_LOCATION } from '../utils/constants';
import { C } from '../theme';
import TimerRing from '../components/TimerRing';
import SignalWarning from '../components/SignalWarning';
import ShakeDetector from '../components/ShakeDetector';
import LocationPoller from '../components/LocationPoller';
import { reverseGeocode } from '../components/LocationSearch';

// Pulse animation helper
function PulseDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 600, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: C.red, transform: [{ scale: pulse }],
      }} />
    </View>
  );
}

export default function JourneyActive({ route, navigation }) {
  const { journeyId, riskLevel, timerSeconds, signalsOnRoute, travelMode, aiSosMessage } = route.params;
  const [timeLeft, setTimeLeft]             = useState(timerSeconds);
  const [signalWarning, setSignalWarning]   = useState(null);
  const [statusBanner, setStatusBanner]     = useState(null);
  const [sosSent, setSosSent]               = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Getting location...');
  const currentLocation = useRef(null);
  const timerRef        = useRef(null);
  const lastGeocode     = useRef(0);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleAlert('timer_expired'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Live location ────────────────────────────────────────────────────────
  const handleLocationUpdate = useCallback(async (coords) => {
    currentLocation.current = coords;
    const now = Date.now();
    if (now - lastGeocode.current < 60_000) return;
    lastGeocode.current = now;
    try {
      const label = await reverseGeocode(coords.latitude, coords.longitude);
      if (label) setCurrentAddress(label);
    } catch (_) {}
  }, []);

  const handlePingResponse = (pingResp) => {
    const { status, message, signal_data } = pingResp;
    if (status === 'alert') {
      handleAlert('route_deviation');
    } else if (status === 'deviation') {
      setStatusBanner({ type: 'warn', text: message });
      setTimeout(() => setStatusBanner(null), 5000);
    } else if (status === 'stop') {
      Alert.alert('Are you okay?', message, [
        { text: "I'm Safe" },
        { text: 'Send SOS', onPress: () => handleAlert('unusual_stop'), style: 'destructive' },
      ]);
    } else if (status === 'signal_warning') {
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);
      setSignalWarning(signal_data);
    }
  };

  // ── Alert / SOS ──────────────────────────────────────────────────────────
  const handleAlert = async (triggerType) => {
    setSosSent(true);
    const loc = currentLocation.current || DEMO_LOCATION;
    try {
      await triggerAlert({
        journey_id:   journeyId,
        trigger_type: triggerType,
        current_lat:  loc.latitude,
        current_lng:  loc.longitude,
        sos_message:  aiSosMessage || null,
      });
    } catch (e) { console.error('Alert trigger failed', e); }
  };

  const handleSafe = async () => {
    clearInterval(timerRef.current);
    try { await endJourney(journeyId); } catch (e) { console.warn('End journey:', e.message); }
    navigation.replace('SafeArrival');
  };

  const handleCancelAlert = () => {
    setSosSent(false);
    setTimeLeft(timerSeconds);
  };

  const RISK_LABEL = { HIGH: 'HIGH RISK', MEDIUM: 'MED RISK', LOW: 'LOW RISK' };
  const RISK_CLR   = { HIGH: C.red, MEDIUM: C.orange, LOW: C.green };
  const riskColor  = RISK_CLR[riskLevel] || C.orange;

  // Mock contacts shown in alerting UI
  const RECIPIENTS = [
    { name: currentAddress !== 'Getting location...' ? 'Primary Contact' : 'Primary Contact',
      detail: 'Trusted Contact', icon: '👤' },
    { name: 'Sector 7 Command', detail: 'Law Enforcement Dispatch', icon: '🚔' },
    { name: 'Med-Response Unit', detail: 'Emergency Medical Standby', icon: '🚑' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Hidden background services */}
      <ShakeDetector onShake={() => handleAlert('shake_sos')} />
      <LocationPoller onLocation={handleLocationUpdate} onPingResponse={handlePingResponse}
        journeyId={journeyId} />

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View style={[s.riskPill, { backgroundColor: RISK_CLR[riskLevel] + '18', borderColor: riskColor + '40' }]}>
          <View style={[s.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[s.riskPillTxt, { color: riskColor }]}>{RISK_LABEL[riskLevel] || 'ACTIVE'}</Text>
        </View>
        <View style={[s.activePill]}>
          <View style={s.activeDot} />
          <Text style={s.activeTxt}>LIVE</Text>
        </View>
      </View>

      {/* ── Location bar ── */}
      <View style={s.locationBar}>
        <Text style={s.locationIcon}>📍</Text>
        <Text style={s.locationTxt} numberOfLines={1}>{currentAddress}</Text>
      </View>

      {/* ── Status banner ── */}
      {statusBanner && (
        <View style={[s.banner, statusBanner.type === 'warn' ? s.bannerWarn : s.bannerInfo]}>
          <Text style={s.bannerTxt}>{statusBanner.text}</Text>
        </View>
      )}

      {/* ── Signal warning ── */}
      {signalWarning && (
        <SignalWarning signal={signalWarning} onDismiss={() => setSignalWarning(null)} />
      )}

      {/* ── ALERTING state ── */}
      {sosSent ? (
        <View style={s.alertingWrap}>
          {/* Status header */}
          <View style={s.alertingHeader}>
            <PulseDot />
            <Text style={s.alertingTitle}>ALERTING CONTACTS...</Text>
          </View>
          <Text style={s.alertingDesc}>
            High-priority SMS and voice dispatch initiated via technical escalation.
          </Text>

          {/* Big SOS ring */}
          <View style={s.sosRingWrap}>
            <View style={s.sosRingOuter}>
              <View style={s.sosRingInner}>
                <Text style={s.sosBigIcon}>🆘</Text>
                <Text style={s.sosBigLabel}>SOS SENT</Text>
              </View>
            </View>
          </View>

          {/* Recipients */}
          <Text style={s.recipientsLabel}>RECIPIENTS</Text>
          <View style={s.recipientsList}>
            {RECIPIENTS.map((r, i) => (
              <View key={i} style={s.recipientRow}>
                <View style={s.recipientIcon}>
                  <Text style={{ fontSize: 20 }}>{r.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recipientName}>{r.name}</Text>
                  <Text style={s.recipientDetail}>{r.detail}</Text>
                </View>
                <View style={s.recipientStatus}>
                  <Text style={{ fontSize: 14 }}>✓</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Cancel */}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancelAlert}>
            <Text style={s.cancelBtnTxt}>CANCEL ALERT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── ACTIVE JOURNEY state ── */
        <View style={s.journeyWrap}>
          {/* Timer */}
          <View style={s.timerSection}>
            <Text style={s.timerLabel}>CONFIRM SAFE IN</Text>
            <View style={s.timerRingWrap}>
              <TimerRing timeLeft={timeLeft} total={timerSeconds} color={riskColor} size={200} />
              <View style={s.timerCenter}>
                <Text style={[s.timerNum, { color: C.text }]}>{timeLeft}</Text>
                <Text style={s.timerUnit}>SECONDS</Text>
              </View>
            </View>
          </View>

          {/* Signal count */}
          {signalsOnRoute > 0 && (
            <View style={s.signalPill}>
              <Text style={s.signalPillTxt}>⚠ {signalsOnRoute} signal{signalsOnRoute > 1 ? 's' : ''} on your route</Text>
            </View>
          )}

          {/* Actions */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.safeBtn} onPress={handleSafe}>
              <Text style={s.safeBtnIcon}>✓</Text>
              <Text style={s.safeBtnTxt}>I'm Safe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sosBtn} onPress={() => handleAlert('manual_sos')}>
              <Text style={s.sosBtnTxt}>SOS</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.shakeHint}>Shake phone to send emergency SOS</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },

  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   paddingHorizontal: 24, paddingTop: 56, paddingBottom: 12 },
  riskPill:      { flexDirection: 'row', alignItems: 'center', gap: 6,
                   paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  riskDot:       { width: 8, height: 8, borderRadius: 4 },
  riskPillTxt:   { fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  activePill:    { flexDirection: 'row', alignItems: 'center', gap: 6,
                   backgroundColor: C.greenBg, paddingHorizontal: 12, paddingVertical: 6,
                   borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  activeDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  activeTxt:     { color: C.green, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },

  locationBar:   { flexDirection: 'row', alignItems: 'center', gap: 8,
                   marginHorizontal: 24, marginBottom: 8,
                   backgroundColor: C.surface, borderRadius: 12,
                   paddingHorizontal: 14, paddingVertical: 10,
                   borderWidth: 1, borderColor: C.border },
  locationIcon:  { fontSize: 14 },
  locationTxt:   { flex: 1, color: C.sub, fontSize: 13 },

  banner:        { marginHorizontal: 24, marginBottom: 8, borderRadius: 12, padding: 12 },
  bannerWarn:    { backgroundColor: C.orangeBg, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  bannerInfo:    { backgroundColor: C.tealBg,   borderWidth: 1, borderColor: 'rgba(14,165,233,0.3)' },
  bannerTxt:     { color: C.text, fontSize: 13 },

  // ── Alerting UI ──────────────────────────────────────────────────────────
  alertingWrap:    { flex: 1, paddingHorizontal: 24 },
  alertingHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  alertingTitle:   { color: C.red, fontSize: 14, fontWeight: '800', letterSpacing: 0.8 },
  alertingDesc:    { color: C.sub, fontSize: 13, lineHeight: 18, marginBottom: 24 },

  sosRingWrap:   { alignItems: 'center', marginBottom: 28 },
  sosRingOuter:  { width: 160, height: 160, borderRadius: 80,
                   backgroundColor: C.redBg, borderWidth: 2, borderColor: C.redBorder,
                   alignItems: 'center', justifyContent: 'center' },
  sosRingInner:  { width: 120, height: 120, borderRadius: 60,
                   backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
                   alignItems: 'center', justifyContent: 'center', gap: 4 },
  sosBigIcon:    { fontSize: 36 },
  sosBigLabel:   { color: C.red, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },

  recipientsLabel:{ color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.0, marginBottom: 10 },
  recipientsList: { gap: 8, marginBottom: 24 },
  recipientRow:  { flexDirection: 'row', alignItems: 'center', gap: 12,
                   backgroundColor: C.surface, borderRadius: 14, padding: 14,
                   borderWidth: 1, borderColor: C.border },
  recipientIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface2,
                   alignItems: 'center', justifyContent: 'center' },
  recipientName: { color: C.text, fontSize: 14, fontWeight: '600' },
  recipientDetail:{ color: C.muted, fontSize: 12, marginTop: 1 },
  recipientStatus:{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.greenBg,
                   alignItems: 'center', justifyContent: 'center',
                   borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },

  cancelBtn:     { backgroundColor: C.text, borderRadius: 16, paddingVertical: 17,
                   alignItems: 'center', marginBottom: 8 },
  cancelBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },

  // ── Active journey UI ────────────────────────────────────────────────────
  journeyWrap:   { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  timerSection:  { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  timerLabel:    { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 20 },
  timerRingWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  timerCenter:   { position: 'absolute', alignItems: 'center' },
  timerNum:      { fontSize: 52, fontWeight: '800', letterSpacing: -2 },
  timerUnit:     { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: -4 },

  signalPill:    { backgroundColor: C.orangeBg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
                   borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', marginBottom: 24 },
  signalPillTxt: { color: C.orange, fontSize: 13, fontWeight: '600' },

  actionRow:     { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 },
  safeBtn:       { flex: 1, backgroundColor: C.text, borderRadius: 16, paddingVertical: 17,
                   flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  safeBtnIcon:   { color: '#fff', fontSize: 18, fontWeight: '700' },
  safeBtnTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  sosBtn:        { width: 80, backgroundColor: C.redBg, borderRadius: 16,
                   alignItems: 'center', justifyContent: 'center',
                   borderWidth: 1.5, borderColor: C.redBorder },
  sosBtnTxt:     { color: C.red, fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },
  shakeHint:     { color: C.muted, fontSize: 12, textAlign: 'center' },
});
