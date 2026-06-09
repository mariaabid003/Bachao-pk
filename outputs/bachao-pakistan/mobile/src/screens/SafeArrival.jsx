import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../theme';

export default function SafeArrival({ navigation }) {
  return (
    <View style={s.root}>
      <View style={s.glow} />
      <View style={s.iconWrap}>
        <Text style={s.icon}>✓</Text>
      </View>
      <Text style={s.title}>You arrived safely.</Text>
      <Text style={s.sub}>No alerts were sent. Stay safe out there.</Text>
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statNum}>0</Text><Text style={s.statLbl}>Alerts</Text></View>
        <View style={s.statDiv} />
        <View style={s.stat}><Text style={s.statNum}>✓</Text><Text style={s.statLbl}>Safe</Text></View>
        <View style={s.statDiv} />
        <View style={s.stat}><Text style={s.statNum}>🛡️</Text><Text style={s.statLbl}>Protected</Text></View>
      </View>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Main', { screen: 'Monitor' })}>
        <Text style={s.btnTxt}>Back to Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.reportBtn} onPress={() => navigation.navigate('IncidentReport')}>
        <Text style={s.reportTxt}>Something happen? Report it →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  glow:    { position: 'absolute', top: '20%', width: 280, height: 280, borderRadius: 140,
             backgroundColor: 'rgba(16,185,129,0.08)', alignSelf: 'center' },
  iconWrap:{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(16,185,129,0.15)',
             alignItems: 'center', justifyContent: 'center', marginBottom: 24,
             borderWidth: 2, borderColor: 'rgba(16,185,129,0.4)' },
  icon:    { fontSize: 44, color: C.green },
  title:   { color: C.text, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  sub:     { color: C.sub, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  statsRow:{ flexDirection: 'row', backgroundColor: C.surface, borderRadius: 18, padding: 20,
             width: '100%', marginBottom: 32, borderWidth: 1, borderColor: C.border },
  stat:    { flex: 1, alignItems: 'center', gap: 6 },
  statNum: { color: C.green, fontSize: 22, fontWeight: '800' },
  statLbl: { color: C.muted, fontSize: 11, fontWeight: '600' },
  statDiv: { width: 1, backgroundColor: C.border },
  btn:     { width: '100%', backgroundColor: C.green, borderRadius: 16, paddingVertical: 17,
             alignItems: 'center', marginBottom: 12 },
  btnTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  reportBtn:{ paddingVertical: 12 },
  reportTxt:{ color: C.muted, fontSize: 13 },
});
