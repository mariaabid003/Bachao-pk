import { CircleMarker, Popup } from 'react-leaflet';

const PIN_COLORS = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#22C55E' };

export default function SignalMarker({ signal }) {
  const color = PIN_COLORS[signal.risk_level] || PIN_COLORS[signal.current_risk_level] || '#94A3B8';
  return (
    <CircleMarker center={[signal.lat, signal.lng]} radius={8}
      pathOptions={{ fillColor: color, fillOpacity: 0.9, color: '#fff', weight: 1.5 }}>
      <Popup>
        <div style={{ background: '#FFFFFF', color: '#0D1829', minWidth: 180, fontSize: 13 }}>
          <strong style={{ color, display: 'block', marginBottom: 6 }}>{signal.name}</strong>
          <p style={{ margin: '2px 0' }}>Risk: <b style={{ color }}>{signal.risk_level || signal.current_risk_level}</b></p>
          <p style={{ margin: '2px 0' }}>This week: {signal.incident_count_week} incidents</p>
          <p style={{ margin: '2px 0' }}>This month: {signal.incident_count_month} incidents</p>
          {signal.peak_hours && <p style={{ margin: '2px 0', color: '#94A3B8' }}>Peak: {signal.peak_hours}</p>}
        </div>
      </Popup>
    </CircleMarker>
  );
}
