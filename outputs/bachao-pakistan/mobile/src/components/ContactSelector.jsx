import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ContactSelector({ contacts = [], onSelect }) {
  const [selected, setSelected] = useState(0);

  const choose = (i) => {
    setSelected(i);
    onSelect?.(contacts[i]);
  };

  return (
    <View>
      <Text style={s.label}>Select trusted contact for this trip</Text>
      {contacts.map((c, i) => (
        <TouchableOpacity key={i} style={[s.contact, selected === i && s.contactActive]}
          onPress={() => choose(i)}>
          <Text style={s.contactName}>{c.name}</Text>
          <Text style={s.contactDetail}>{c.relation} · {c.phone}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  label:         { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  contact:       { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  contactActive: { borderColor: '#ef4444' },
  contactName:   { color: '#f8fafc', fontSize: 15, fontWeight: '600' },
  contactDetail: { color: '#64748b', fontSize: 13, marginTop: 2 },
});
