import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { C } from '../theme';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const REVERSE   = 'https://nominatim.openstreetmap.org/reverse';

// Karachi bounding box — keeps results local
const VIEWBOX = '66.75,24.60,67.50,25.10';

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `${REVERSE}?lat=${lat}&lon=${lng}&format=json&zoom=16`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'BachaoPakistan/1.0' } }
    );
    const data = await res.json();
    const a = data.address || {};
    return (
      a.road || a.suburb || a.neighbourhood ||
      a.city_district || data.display_name?.split(',')[0] || 'Current Location'
    );
  } catch {
    return 'Current Location';
  }
}

export default function LocationSearch({
  placeholder = 'Search location…',
  value,
  onSelect,
  icon = '📍',
  style,
}) {
  const [query, setQuery]       = useState(value || '');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const debounce = useRef(null);

  useEffect(() => { if (value && value !== query) setQuery(value); }, [value]);

  const search = (text) => {
    setQuery(text);
    setOpen(true);
    clearTimeout(debounce.current);
    if (text.length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `${NOMINATIM}?q=${encodeURIComponent(text + ' Karachi')}&format=json&limit=6&viewbox=${VIEWBOX}&bounded=0&countrycodes=pk&addressdetails=1`;
        const res  = await fetch(url, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'BachaoPakistan/1.0' }
        });
        const data = await res.json();
        setResults(data);
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
  };

  const pick = (item) => {
    const label = formatLabel(item);
    setQuery(label);
    setResults([]);
    setOpen(false);
    onSelect?.({ label, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  };

  const formatLabel = (item) => {
    const a = item.address || {};
    const parts = [
      a.road || a.suburb || a.neighbourhood || item.name,
      a.city_district || a.suburb,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : item.display_name?.split(',').slice(0, 2).join(',');
  };

  return (
    <View style={[s.wrap, style]}>
      <View style={s.inputRow}>
        <Text style={s.icon}>{icon}</Text>
        <TextInput
          style={s.input}
          value={query}
          onChangeText={search}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          onFocus={() => query.length > 1 && setOpen(true)}
        />
        {loading && <ActivityIndicator size="small" color={C.red} style={{ marginRight: 12 }} />}
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); onSelect?.(null); }}>
            <Text style={s.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {open && results.length > 0 && (
        <View style={s.dropdown}>
          <FlatList
            data={results}
            keyExtractor={i => i.place_id?.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.result} onPress={() => pick(item)}>
                <Text style={s.resultIcon}>
                  {item.type === 'fuel' ? '⛽' :
                   item.type === 'hospital' ? '🏥' :
                   item.class === 'highway' ? '🛣️' :
                   item.class === 'amenity' ? '🏢' : '📍'}
                </Text>
                <View style={s.resultText}>
                  <Text style={s.resultName} numberOfLines={1}>{formatLabel(item)}</Text>
                  <Text style={s.resultSub} numberOfLines={1}>
                    {item.display_name?.split(',').slice(1, 3).join(',').trim()}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { position: 'relative', zIndex: 10 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
                borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  icon:       { fontSize: 16, marginRight: 8 },
  input:      { flex: 1, color: C.text, fontSize: 15, paddingVertical: 15 },
  clear:      { color: C.muted, fontSize: 16, paddingHorizontal: 8 },
  dropdown:   { position: Platform.OS === 'web' ? 'absolute' : 'relative',
                top: Platform.OS === 'web' ? 56 : 0,
                left: 0, right: 0,
                backgroundColor: C.surface2, borderRadius: 14, marginTop: 4,
                borderWidth: 1, borderColor: C.border, overflow: 'hidden',
                ...(Platform.OS === 'web' ? { zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' } : {}) },
  result:     { flexDirection: 'row', alignItems: 'center', padding: 12,
                borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  resultIcon: { fontSize: 18, width: 24 },
  resultText: { flex: 1 },
  resultName: { color: C.text, fontSize: 14, fontWeight: '600' },
  resultSub:  { color: C.muted, fontSize: 12, marginTop: 2 },
});
