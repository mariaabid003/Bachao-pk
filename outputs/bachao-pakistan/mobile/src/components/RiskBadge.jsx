import { View, Text, StyleSheet } from 'react-native';
import { RISK_COLORS } from '../utils/constants';

const LABELS = { HIGH: '🔴 HIGH RISK', MEDIUM: '🟡 MEDIUM RISK', LOW: '🟢 LOW RISK' };

export default function RiskBadge({ level, large, style }) {
  return (
    <View style={[s.badge, { backgroundColor: RISK_COLORS[level] + '22', borderColor: RISK_COLORS[level] }, style]}>
      <Text style={[s.text, large && s.textLarge, { color: RISK_COLORS[level] }]}>
        {LABELS[level] || level}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge:     { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, borderWidth: 1, alignSelf: 'flex-start' },
  text:      { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  textLarge: { fontSize: 18 },
});
