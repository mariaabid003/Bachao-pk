const TYPE_ICONS = {
  phone_snatching: '🏍️', ride_hailing: '🚗', mugging: '👊',
  signal_robbery: '🚦', harassment: '😰', other: '📋',
};

export default function IncidentCard({ incident }) {
  const icon = TYPE_ICONS[incident.type] || '📋';
  const date = new Date(incident.datetime || incident.created_at).toLocaleString('en-PK', {
    dateStyle: 'short', timeStyle: 'short',
  });
  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={s.type}>{incident.type?.replace(/_/g, ' ')}</span>
      </div>
      {incident.signal_name && <p style={s.signal}>📍 {incident.signal_name}</p>}
      {incident.description  && <p style={s.desc}>{incident.description}</p>}
      <p style={s.date}>{date}</p>
    </div>
  );
}

const s = {
  card:   { background: '#FFFFFF', borderRadius: 12, padding: 16, borderLeft: '3px solid #EF4444',
            border: '1px solid rgba(15,23,42,0.08)', borderLeftWidth: 3, borderLeftColor: '#EF4444' },
  header: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  type:   { color: '#0D1829', fontSize: 14, fontWeight: 600, textTransform: 'capitalize' },
  signal: { color: '#475569', fontSize: 13, margin: '4px 0' },
  desc:   { color: '#475569', fontSize: 13, margin: '4px 0' },
  date:   { color: '#94A3B8', fontSize: 12, marginTop: 8 },
};
