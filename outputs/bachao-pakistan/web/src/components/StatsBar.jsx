export default function StatsBar({ hotspotCount, signalCount, incidentCount, topSignal }) {
  const stats = [
    { label: 'Crime Zones',            value: hotspotCount,           color: '#0D1829' },
    { label: 'High-Risk Signals',       value: signalCount,            color: '#EF4444' },
    { label: 'Total Incidents',         value: incidentCount,          color: '#0D1829' },
    { label: 'Most Dangerous Signal',   value: topSignal || '—',       color: '#F59E0B' },
  ];
  return (
    <div style={s.bar}>
      {stats.map((st, i) => (
        <div key={i} style={s.item}>
          <span style={{ ...s.val, color: st.color }}>{st.value}</span>
          <span style={s.label}>{st.label}</span>
        </div>
      ))}
    </div>
  );
}

const s = {
  bar:   { display: 'flex', gap: 24, background: '#FFFFFF', padding: '16px 24px', borderRadius: 12,
           marginBottom: 24, flexWrap: 'wrap', border: '1px solid rgba(15,23,42,0.08)' },
  item:  { display: 'flex', flexDirection: 'column' },
  val:   { fontSize: 22, fontWeight: 'bold' },
  label: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
};
