import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, StatusBar,
} from 'react-native';
import { C } from '../theme';

const KARACHI_AREAS = [
  { name: 'Lyari',           risk: 'HIGH',   crime_index: 0.92, incidents: 47, top: 'Gang violence, robbery' },
  { name: 'Orangi Town',     risk: 'HIGH',   crime_index: 0.87, incidents: 43, top: 'Mugging, vehicle theft' },
  { name: 'Teen Talwar',     risk: 'HIGH',   crime_index: 0.78, incidents: 39, top: 'Mobile snatching' },
  { name: 'Sohrab Goth',     risk: 'HIGH',   crime_index: 0.76, incidents: 38, top: 'Drug trade, robbery' },
  { name: 'New Karachi',     risk: 'HIGH',   crime_index: 0.72, incidents: 36, top: 'Mugging, theft' },
  { name: 'Korangi',         risk: 'HIGH',   crime_index: 0.70, incidents: 35, top: 'Vehicle theft, robbery' },
  { name: 'Baldia Town',     risk: 'HIGH',   crime_index: 0.70, incidents: 35, top: 'Robbery, assault' },
  { name: 'Malir',           risk: 'HIGH',   crime_index: 0.68, incidents: 34, top: 'Theft, carjacking' },
  { name: 'Landhi',          risk: 'HIGH',   crime_index: 0.65, incidents: 33, top: 'Mugging, phone snatching' },
  { name: 'Liaquatabad',     risk: 'MEDIUM', crime_index: 0.62, incidents: 24, top: 'Mugging, theft' },
  { name: 'Saddar',          risk: 'MEDIUM', crime_index: 0.60, incidents: 22, top: 'Phone snatching, robbery' },
  { name: 'North Nazimabad', risk: 'MEDIUM', crime_index: 0.58, incidents: 20, top: 'Vehicle theft' },
  { name: 'Gulberg',         risk: 'MEDIUM', crime_index: 0.55, incidents: 18, top: 'Mugging' },
  { name: 'Gulshan-e-Iqbal', risk: 'MEDIUM', crime_index: 0.52, incidents: 17, top: 'Phone snatching' },
  { name: 'Clifton',         risk: 'MEDIUM', crime_index: 0.50, incidents: 16, top: 'Mobile snatching' },
  { name: 'Kemari',          risk: 'MEDIUM', crime_index: 0.50, incidents: 15, top: 'Robbery' },
  { name: 'Ferozabad',       risk: 'MEDIUM', crime_index: 0.48, incidents: 14, top: 'Theft' },
  { name: 'Defence View',    risk: 'LOW',    crime_index: 0.38, incidents: 8,  top: 'Minor theft' },
  { name: 'DHA Phase 1',     risk: 'LOW',    crime_index: 0.26, incidents: 4,  top: 'Minor theft' },
  { name: 'DHA Phase 6',     risk: 'LOW',    crime_index: 0.22, incidents: 3,  top: 'Minor theft' },
  { name: 'Bahria Town',     risk: 'LOW',    crime_index: 0.15, incidents: 2,  top: 'Minor incidents' },
];

const RISK_COLOR  = { HIGH: C.red,    MEDIUM: C.orange, LOW: C.green };
const RISK_BG     = { HIGH: C.redBg,  MEDIUM: C.orangeBg, LOW: C.greenBg };
const RISK_BORDER = { HIGH: C.redBorder, MEDIUM: 'rgba(245,158,11,0.25)', LOW: 'rgba(34,197,94,0.25)' };

export default function Heatmap() {
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('ALL');

  const shown = KARACHI_AREAS
    .filter(a => filter === 'ALL' || a.risk === filter)
    .filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  const counts = {
    HIGH:   KARACHI_AREAS.filter(a => a.risk === 'HIGH').length,
    MEDIUM: KARACHI_AREAS.filter(a => a.risk === 'MEDIUM').length,
    LOW:    KARACHI_AREAS.filter(a => a.risk === 'LOW').length,
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={s.header}>
        <Text style={s.appLabel}>GUARDIAN SYSTEM</Text>
        <Text style={s.headerTitle}>Karachi Safety Heatmap</Text>
      </View>

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Check a location..."
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={s.statsRow}>
        {[
          { key: 'ALL',    label: 'ALL',  count: KARACHI_AREAS.length, color: C.text },
          { key: 'HIGH',   label: 'HIGH', count: counts.HIGH,   color: C.red    },
          { key: 'MEDIUM', label: 'MED',  count: counts.MEDIUM, color: C.orange  },
          { key: 'LOW',    label: 'SAFE', count: counts.LOW,    color: C.green   },
        ].map(({ key, label, count, color }) => (
          <TouchableOpacity
            key={key}
            style={[s.statChip, filter === key && s.statChipActive]}
            onPress={() => setFilter(key)}>
            <Text style={[s.statCount, { color }]}>{count}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={s.list}
        contentContainerStyle={s.listContent}>
        {shown.map((area, i) => (
          <View key={i} style={[s.areaCard, { borderLeftColor: RISK_COLOR[area.risk] }]}>
            <View style={s.areaLeft}>
              <View style={s.areaNameRow}>
                <Text style={s.areaName}>{area.name}</Text>
                <View style={[s.riskChip, {
                  backgroundColor: RISK_BG[area.risk],
                  borderColor: RISK_BORDER[area.risk],
                }]}>
                  <Text style={[s.riskChipTxt, { color: RISK_COLOR[area.risk] }]}>{area.risk}</Text>
                </View>
              </View>
              <Text style={s.areaTop}>{area.top}</Text>

              {/* Crime index bar — flex-based, no percentage width */}
              <View style={s.barTrack}>
                <View style={[s.barFill, {
                  flex: area.crime_index,
                  backgroundColor: RISK_COLOR[area.risk],
                }]} />
                <View style={{ flex: 1 - area.crime_index }} />
              </View>
            </View>
            <View style={s.areaRight}>
              <Text style={[s.incidentCount, { color: RISK_COLOR[area.risk] }]}>{area.incidents}</Text>
              <Text style={s.incidentLabel}>wkly</Text>
            </View>
          </View>
        ))}
        {shown.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={{ fontSize: 32 }}>🔍</Text>
            <Text style={s.emptyTxt}>No areas match "{query}"</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 },
  appLabel:     { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  headerTitle:  { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },

  searchWrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24,
                  backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14,
                  marginBottom: 16, borderWidth: 1, borderColor: C.border },
  searchIcon:   { fontSize: 16, marginRight: 8 },
  searchInput:  { flex: 1, color: C.text, fontSize: 15, paddingVertical: 14 },

  statsRow:     { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16,
                  justifyContent: 'space-between' },
  statChip:     { flex: 1, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 10,
                  alignItems: 'center', borderWidth: 1, borderColor: C.border, marginHorizontal: 3 },
  statChipActive: { backgroundColor: C.surface2, borderColor: C.borderMed },
  statCount:    { fontSize: 18, fontWeight: '800' },
  statLabel:    { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  list:         { flex: 1 },
  listContent:  { paddingHorizontal: 24, paddingBottom: 24 },

  areaCard:     { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 10,
                  flexDirection: 'row', alignItems: 'center',
                  borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  areaLeft:     { flex: 1, marginRight: 12 },
  areaNameRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' },
  areaName:     { color: C.text, fontSize: 14, fontWeight: '700', marginRight: 8 },
  riskChip:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  riskChipTxt:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  areaTop:      { color: C.muted, fontSize: 11, marginBottom: 8 },
  barTrack:     { height: 4, flexDirection: 'row', backgroundColor: C.surface2, borderRadius: 2 },
  barFill:      { height: 4, borderRadius: 2 },

  areaRight:    { alignItems: 'center', minWidth: 44 },
  incidentCount:{ fontSize: 20, fontWeight: '800' },
  incidentLabel:{ color: C.muted, fontSize: 10, fontWeight: '600' },

  emptyWrap:    { alignItems: 'center', paddingTop: 48 },
  emptyTxt:     { color: C.muted, fontSize: 14, marginTop: 12 },
});
