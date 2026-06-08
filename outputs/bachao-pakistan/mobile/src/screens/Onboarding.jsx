import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { TRAVEL_MODES } from '../utils/constants';
import { C } from '../theme';
import api from '../utils/api';

const STEPS = { WELCOME: 0, MODE: 1, CONTACTS: 2 };

const StepDots = ({ step }) => (
  <View style={s.dots}>
    {[0,1,2].map(i => (
      <View key={i} style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]} />
    ))}
  </View>
);

const modeDesc = {
  ride_hailing: 'Uber, Careem, InDrive rides',
  solo:         'Walking, public transport',
  biker:        'Motorbike — highest signal risk',
};

export default function Onboarding({ navigation }) {
  const [step, setStep]             = useState(STEPS.WELCOME);
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [travelMode, setTravelMode] = useState('solo');
  const [contacts, setContacts]     = useState([{ name: '', phone: '', relation: '' }]);
  const [loading, setLoading]       = useState(false);

  const saveProfile = async () => {
    setLoading(true);
    const fullPhone = '+92' + phone;
    try {
      await setDoc(doc(db, 'users', 'demo-user'), {
        name, phone: fullPhone, travel_mode: travelMode,
        contacts: contacts.filter(c => c.name && c.phone),
        createdAt: new Date().toISOString(),
      });
      try {
        await api.post('/user/register', {
          name, phone: fullPhone, travel_mode: travelMode,
          contacts: contacts.filter(c => c.name && c.phone),
        });
      } catch (e) { console.warn('Register SMS failed:', e.message); }
    } catch (e) { console.warn('Profile save failed:', e.message); }
    setLoading(false);
    navigation.replace('Main');
  };

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {step === STEPS.WELCOME && (
          <View style={s.page}>
            <View style={s.hero}>
              <View style={s.shieldWrap}><Text style={s.shieldIcon}>🛡️</Text></View>
              <Text style={s.heroTitle}>Bachao Pakistan</Text>
              <Text style={s.heroSub}>Predicting danger before it finds you{'\n'}Karachi's AI-powered safety platform</Text>
            </View>
            <View style={s.form}>
              <StepDots step={0} />
              <Text style={s.formTitle}>Create your profile</Text>
              <Text style={s.lbl}>YOUR NAME</Text>
              <TextInput style={s.inp} value={name} onChangeText={setName}
                placeholder="Full name" placeholderTextColor={C.muted} autoCapitalize="words" />
              <Text style={s.lbl}>PHONE NUMBER</Text>
              <View style={s.phoneRow}>
                <View style={s.codeBox}><Text style={s.codeText}>🇵🇰 +92</Text></View>
                <TextInput style={[s.inp, s.phoneInput]} keyboardType="phone-pad"
                  value={phone} onChangeText={setPhone}
                  placeholder="3001234567" placeholderTextColor={C.muted} />
              </View>
              <Text style={s.hint}>You'll receive an SMS to confirm</Text>
              <TouchableOpacity style={[s.btn, (!name || !phone) && s.btnDisabled]}
                onPress={() => name && phone && setStep(STEPS.MODE)} disabled={!name || !phone}>
                <Text style={s.btnTxt}>Continue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === STEPS.MODE && (
          <View style={s.page}>
            <View style={[s.hero, s.heroSmall]}>
              <Text style={s.heroTitle}>How do you travel?</Text>
              <Text style={s.heroSub}>We tailor risk warnings to your mode</Text>
            </View>
            <View style={s.form}>
              <StepDots step={1} />
              {TRAVEL_MODES.map(m => (
                <TouchableOpacity key={m.id} style={[s.modeCard, travelMode === m.id && s.modeCardActive]}
                  onPress={() => setTravelMode(m.id)}>
                  <Text style={s.modeIcon}>{m.icon}</Text>
                  <View style={s.modeInfo}>
                    <Text style={[s.modeName, travelMode === m.id && s.modeNameActive]}>{m.label}</Text>
                    <Text style={s.modeDesc}>{modeDesc[m.id]}</Text>
                  </View>
                  {travelMode === m.id && <Text style={s.modeTick}>✓</Text>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.btn} onPress={() => setStep(STEPS.CONTACTS)}>
                <Text style={s.btnTxt}>Continue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === STEPS.CONTACTS && (
          <View style={s.page}>
            <View style={[s.hero, s.heroSmall]}>
              <Text style={s.heroTitle}>Trusted Contacts</Text>
              <Text style={s.heroSub}>Who should we alert if you stop responding?</Text>
            </View>
            <View style={s.form}>
              <StepDots step={2} />
              {contacts.map((c, i) => (
                <View key={i} style={s.contactBlock}>
                  <Text style={s.contactLabel}>CONTACT {i + 1}</Text>
                  <TextInput style={s.inp} placeholder="Full name" value={c.name}
                    onChangeText={v => updateContact(i, 'name', v)} placeholderTextColor={C.muted} />
                  <TextInput style={s.inp} placeholder="03xxxxxxxxx" value={c.phone}
                    keyboardType="phone-pad" onChangeText={v => updateContact(i, 'phone', v)} placeholderTextColor={C.muted} />
                  <TextInput style={[s.inp, { marginBottom: 0 }]} placeholder="Relationship (e.g. Ammi, Bhai)" value={c.relation}
                    onChangeText={v => updateContact(i, 'relation', v)} placeholderTextColor={C.muted} />
                </View>
              ))}
              {contacts.length < 3 && (
                <TouchableOpacity style={s.addBtn}
                  onPress={() => setContacts([...contacts, { name: '', phone: '', relation: '' }])}>
                  <Text style={s.addTxt}>＋ Add another contact</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={saveProfile} disabled={loading}>
                <Text style={s.btnTxt}>{loading ? 'Setting up…' : '🛡️  Start Using Bachao'}</Text>
              </TouchableOpacity>
              <Text style={s.privacyNote}>Your data is encrypted and never shared with third parties.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flexGrow: 1 },
  page:          { flex: 1 },
  hero:          { paddingTop: 64, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 24, backgroundColor: C.bg },
  heroSmall:     { paddingTop: 48, paddingBottom: 20 },
  shieldWrap:    { width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(239,68,68,0.12)',
                   alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                   borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  shieldIcon:    { fontSize: 42 },
  heroTitle:     { color: C.text, fontSize: 27, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  heroSub:       { color: C.sub, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  form:          { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
                   padding: 28, paddingBottom: 56, borderTopWidth: 1, borderTopColor: C.border, flexGrow: 1 },
  formTitle:     { color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 20 },
  dots:          { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: C.muted },
  dotActive:     { width: 24, backgroundColor: C.red, borderRadius: 4 },
  dotDone:       { backgroundColor: C.green },
  lbl:           { color: C.sub, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 7, marginTop: 4 },
  inp:           { backgroundColor: C.surface2, color: C.text, borderRadius: 12, paddingVertical: 15,
                   paddingHorizontal: 16, fontSize: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  phoneRow:      { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 0 },
  codeBox:       { backgroundColor: C.surface2, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 14,
                   borderWidth: 1, borderColor: C.border },
  codeText:      { color: C.text, fontSize: 15, fontWeight: '600' },
  phoneInput:    { flex: 1, marginBottom: 14 },
  hint:          { color: C.muted, fontSize: 12, marginBottom: 16 },
  btn:           { backgroundColor: C.red, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  btnDisabled:   { opacity: 0.4 },
  btnTxt:        { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  modeCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface2, borderRadius: 14,
                   padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border, gap: 14 },
  modeCardActive:{ borderColor: C.red, backgroundColor: 'rgba(239,68,68,0.08)' },
  modeIcon:      { fontSize: 26 },
  modeInfo:      { flex: 1 },
  modeName:      { color: C.sub, fontSize: 15, fontWeight: '600' },
  modeNameActive:{ color: C.text },
  modeDesc:      { color: C.muted, fontSize: 12, marginTop: 2 },
  modeTick:      { color: C.red, fontSize: 18, fontWeight: '700' },
  contactBlock:  { backgroundColor: C.surface2, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  contactLabel:  { color: C.red, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  addBtn:        { borderWidth: 1, borderColor: C.red, borderStyle: 'dashed', borderRadius: 12,
                   paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  addTxt:        { color: C.red, fontSize: 14, fontWeight: '600' },
  privacyNote:   { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
