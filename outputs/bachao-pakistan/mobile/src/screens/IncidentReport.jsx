import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { reportIncident } from '../utils/api';
import { DEMO_LOCATION, INCIDENT_TYPES } from '../utils/constants';
import { C } from '../theme';

const KARACHI_SIGNALS = [
  'Teen Talwar Signal','Numaish Signal','Hassan Square','Baloch Colony Signal',
  'Gulshan Chowrangi','Tariq Road Signal','Shahra-e-Faisal Signal','Other',
];

export default function IncidentReport({ navigation }) {
  const [type, setType]           = useState('');
  const [signalName, setSignal]   = useState('');
  const [description, setDesc]    = useState('');
  const [anonymous, setAnon]      = useState(true);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const submit = async () => {
    if (!type) { Alert.alert('Select an incident type first'); return; }
    setLoading(true);
    try {
      let coords = DEMO_LOCATION;
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            coords = loc.coords;
          }
        } catch (e) { console.warn('Location failed:', e.message); }
      }
      await reportIncident({ type, lat: coords.latitude, lng: coords.longitude,
        signal_name: signalName || null, description, anonymous });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 2000);
    } catch (e) {
      Alert.alert('Error', 'Could not submit. Try again.');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <View style={s.successScreen}>
        <Text style={s.successIcon}>✓</Text>
        <Text style={s.successTitle}>Report submitted!</Text>
        <Text style={s.successSub}>Thank you. Your report helps protect others in Karachi.</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Report Incident</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>
        <View style={s.content}>
          <Text style={s.lbl}>INCIDENT TYPE</Text>
          <View style={s.typeGrid}>
            {INCIDENT_TYPES.map(t => (
              <TouchableOpacity key={t.id} style={[s.typeCard, type === t.id && s.typeCardActive]}
                onPress={() => setType(t.id)}>
                <Text style={s.typeEmoji}>{t.icon}</Text>
                <Text style={[s.typeLabel, type === t.id && s.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(type === 'signal_robbery' || type === 'phone_snatching') && (
            <>
              <Text style={s.lbl}>SIGNAL LOCATION</Text>
              <View style={s.signalGrid}>
                {KARACHI_SIGNALS.map(sig => (
                  <TouchableOpacity key={sig} style={[s.sigChip, signalName === sig && s.sigChipActive]}
                    onPress={() => setSignal(sig)}>
                    <Text style={[s.sigChipTxt, signalName === sig && s.sigChipTxtActive]}>{sig}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={s.lbl}>DESCRIPTION (optional)</Text>
          <TextInput style={s.textarea} value={description} onChangeText={setDesc} multiline
            placeholder="Brief description of what happened..." placeholderTextColor={C.muted}
            numberOfLines={4} textAlignVertical="top" />

          <View style={s.anonRow}>
            <View>
              <Text style={s.anonTitle}>Submit anonymously</Text>
              <Text style={s.anonSub}>Your identity will not be shared</Text>
            </View>
            <Switch value={anonymous} onValueChange={setAnon}
              trackColor={{ false: C.border, true: 'rgba(239,68,68,0.5)' }}
              thumbColor={anonymous ? C.red : C.muted} />
          </View>

          <TouchableOpacity style={[s.btn, (!type || loading) && s.btnDisabled]}
            onPress={submit} disabled={!type || loading}>
            <Text style={s.btnTxt}>{loading ? 'Submitting…' : 'Submit Report'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  backBtn:        { paddingVertical: 8, paddingHorizontal: 4 },
  backTxt:        { color: C.sub, fontSize: 15 },
  headerTitle:    { color: C.text, fontSize: 17, fontWeight: '700' },
  scroll:         { flex: 1 },
  content:        { padding: 20 },
  lbl:            { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  typeGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeCard:       { width: '48%', backgroundColor: C.surface, borderRadius: 14, padding: 14,
                    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border },
  typeCardActive: { borderColor: C.red, backgroundColor: 'rgba(239,68,68,0.08)' },
  typeEmoji:      { fontSize: 24 },
  typeLabel:      { color: C.sub, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  typeLabelActive:{ color: C.text },
  signalGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  sigChip:        { backgroundColor: C.surface, borderRadius: 20, paddingVertical: 8,
                    paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  sigChipActive:  { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: C.red },
  sigChipTxt:     { color: C.sub, fontSize: 13 },
  sigChipTxtActive:{ color: C.red, fontWeight: '600' },
  textarea:       { backgroundColor: C.surface, color: C.text, borderRadius: 14, padding: 14,
                    fontSize: 14, minHeight: 100, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  anonRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 20,
                    borderWidth: 1, borderColor: C.border },
  anonTitle:      { color: C.text, fontSize: 14, fontWeight: '600' },
  anonSub:        { color: C.muted, fontSize: 12, marginTop: 2 },
  btn:            { backgroundColor: C.red, borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  btnDisabled:    { opacity: 0.4 },
  btnTxt:         { color: '#fff', fontSize: 16, fontWeight: '700' },
  successScreen:  { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon:    { fontSize: 56, color: C.green, marginBottom: 16 },
  successTitle:   { color: C.text, fontSize: 26, fontWeight: '800', marginBottom: 10 },
  successSub:     { color: C.sub, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
