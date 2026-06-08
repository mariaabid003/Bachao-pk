import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { C } from '../theme';
import RiskBadge from '../components/RiskBadge';

export default function RiskResult({ route, navigation }) {
  const { riskResult, journeyData, travelMode, aiAnalysis, aiSosMessage } = route.params;

  const handleStart = () => {
    navigation.replace('JourneyActive', {
      journeyId: journeyData.journey_id,
      riskLevel: riskResult.risk_level,
      timerSeconds: journeyData.timer_duration_seconds,
      signalsOnRoute: journeyData.signals_on_route,
      travelMode,
      aiSosMessage,
    });
  };

  const signals = riskResult.high_risk_signals || [];
  const score   = Math.round((riskResult.risk_score || 0.5) * 100);
  const level   = riskResult.risk_level || 'MEDIUM';

  const levelColor = { HIGH: C.red, MEDIUM: C.orange, LOW: C.green }[level] || C.orange;
  const levelBg    = { HIGH: 'rgba(239,68,68,0.1)', MEDIUM: 'rgba(249,115,22,0.1)', LOW: 'rgba(16,185,129,0.1)' }[level];

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Route Analysis</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Risk Score Hero */}
        <View style={[s.heroCard, { borderColor: levelColor + '40' }]}>
          <View style={[s.scoreCircle, { borderColor: levelColor, backgroundColor: levelBg }]}>
            <Text style={[s.scoreNum, { color: levelColor }]}>{score}%</Text>
            <Text style={s.scoreLabel}>risk score</Text>
          </View>
          <RiskBadge level={level} large />
          {journeyData?.expected_arrival && (
            <View style={s.etaRow}>
              <Text style={s.etaIcon}>⏱️</Text>
              <Text style={s.etaTxt}>ETA {journeyData.expected_arrival}</Text>
            </View>
          )}
        </View>

        {/* AI Safety Brief — most prominent section */}
        {aiAnalysis ? (
          <View style={s.aiCard}>
            <View style={s.aiHeader}>
              <Text style={s.aiIcon}>🤖</Text>
              <View>
                <Text style={s.aiTitle}>AI Safety Brief</Text>
                <Text style={s.aiPowered}>powered by Claude</Text>
              </View>
            </View>
            <Text style={s.aiText}>{aiAnalysis}</Text>
          </View>
        ) : (
          <View style={[s.aiCard, s.aiLoading]}>
            <Text style={s.aiLoadingTxt}>🤖  Generating AI safety brief…</Text>
          </View>
        )}

        {/* Why this risk */}
        {(riskResult.risk_factors || []).length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>WHY THIS RISK</Text>
            {riskResult.risk_factors.map((f, i) => (
              <View key={i} style={s.factorRow}>
                <View style={[s.factorDot, { backgroundColor: levelColor }]} />
                <Text style={s.factorTxt}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Signals on route */}
        {signals.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>⚠️  SIGNALS ON YOUR ROUTE</Text>
            {signals.slice(0, 3).map((sig, i) => (
              <View key={i} style={s.sigCard}>
                <View style={s.sigTop}>
                  <Text style={s.sigName}>{sig.name || sig.signal_name}</Text>
                  <View style={s.sigCountBubble}>
                    <Text style={s.sigCount}>{sig.weekly_incidents ?? sig.incident_count_week ?? '–'}</Text>
                  </View>
                </View>
                {sig.peak_hours && (
                  <Text style={s.sigPeak}>🕐 Peak: {Array.isArray(sig.peak_hours) ? sig.peak_hours.map(h => `${h}h`).join(', ') : sig.peak_hours}</Text>
                )}
                <Text style={s.sigWarn}>You'll be warned 200m before this signal</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <View style={s.ctaWrap}>
          <TouchableOpacity style={s.startBtn} onPress={handleStart}>
            <Text style={s.startTxt}>START MONITORING</Text>
          </TouchableOpacity>
          <Text style={s.ctaNote}>Monitoring runs silently. You'll be alerted to danger.</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  backBtn:      { paddingVertical: 8, paddingHorizontal: 4 },
  backTxt:      { color: C.sub, fontSize: 15 },
  headerTitle:  { color: C.text, fontSize: 17, fontWeight: '700' },
  heroCard:     { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 20, padding: 24,
                  alignItems: 'center', gap: 14, marginBottom: 16, borderWidth: 1 },
  scoreCircle:  { width: 100, height: 100, borderRadius: 50, borderWidth: 3,
                  alignItems: 'center', justifyContent: 'center' },
  scoreNum:     { fontSize: 28, fontWeight: '800' },
  scoreLabel:   { color: C.muted, fontSize: 11, marginTop: 2 },
  etaRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  etaIcon:      { fontSize: 14 },
  etaTxt:       { color: C.sub, fontSize: 14 },
  aiCard:       { marginHorizontal: 20, backgroundColor: '#160D2F', borderRadius: 18, padding: 18,
                  marginBottom: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
                  borderLeftWidth: 4, borderLeftColor: C.purple },
  aiHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  aiIcon:       { fontSize: 22 },
  aiTitle:      { color: C.purple, fontSize: 14, fontWeight: '700' },
  aiPowered:    { color: C.muted, fontSize: 11, marginTop: 1 },
  aiText:       { color: '#C4B5FD', fontSize: 14, lineHeight: 22 },
  aiLoading:    { alignItems: 'center', paddingVertical: 20 },
  aiLoadingTxt: { color: C.purple, fontSize: 14, opacity: 0.7 },
  section:      { marginHorizontal: 20, marginBottom: 16 },
  sectionLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  factorRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  factorDot:    { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  factorTxt:    { color: C.sub, fontSize: 14, lineHeight: 22, flex: 1 },
  sigCard:      { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8,
                  borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderLeftWidth: 3, borderLeftColor: C.red },
  sigTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sigName:      { color: C.text, fontSize: 14, fontWeight: '600', flex: 1 },
  sigCountBubble:{ backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sigCount:     { color: C.red, fontSize: 13, fontWeight: '700' },
  sigPeak:      { color: C.sub, fontSize: 12, marginBottom: 4 },
  sigWarn:      { color: C.muted, fontSize: 11 },
  ctaWrap:      { paddingHorizontal: 20, marginTop: 4 },
  startBtn:     { backgroundColor: C.red, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  startTxt:     { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  ctaNote:      { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
