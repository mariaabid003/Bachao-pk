import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { getAllSignals } from '../utils/api';
import Navbar from '../components/Navbar';

const KARACHI_CENTER = [24.8607, 67.0104];
const PIN_COLORS     = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#22C55E' };

export default function SafeSignalsMap() {
  const [signals, setSignals] = useState([]);
  const [filter,  setFilter]  = useState('ALL');

  useEffect(() => {
    getAllSignals().then(r => setSignals(r.data)).catch(console.warn);
  }, []);

  const hour     = new Date().getHours();
  const filtered = signals.filter(s => {
    const level = s.risk_level || s.current_risk_level;
    if (filter==='HIGH') return level==='HIGH';
    if (filter==='NOW')  return s.peak_hours?.includes?.(hour);
    return true;
  });

  const highCount   = signals.filter(s => (s.risk_level||s.current_risk_level)==='HIGH').length;
  const mediumCount = signals.filter(s => (s.risk_level||s.current_risk_level)==='MEDIUM').length;

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>

        <div style={s.sidebar}>
          <h2 style={s.sideTitle}>🚦 Signal Risk Map</h2>
          <p style={s.sideSub}>All Karachi signals, scored in real time</p>

          <div style={s.countRow}>
            {[
              { val: highCount,   label: 'HIGH risk',  color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
              { val: mediumCount, label: 'MEDIUM risk', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
              { val: signals.length - highCount - mediumCount, label: 'SAFE', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
            ].map((c, i) => (
              <div key={i} style={{ ...s.countCard, background: c.bg }}>
                <span style={{ color: c.color, fontSize: 28, fontWeight: 800 }}>{c.val}</span>
                <span style={{ color: '#94A3B8', fontSize: 11 }}>{c.label}</span>
              </div>
            ))}
          </div>

          <p style={s.filterLbl}>FILTER</p>
          <div style={s.filterRow}>
            {[
              { key: 'ALL',    label: '🗺 All',        },
              { key: 'HIGH',   label: '🔴 High risk',  },
              { key: 'NOW',    label: '🕐 Active now', },
            ].map(f => (
              <button key={f.key}
                style={{ ...s.filterBtn, ...(filter===f.key ? s.filterBtnActive : {}) }}
                onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>

          <p style={s.filterLbl}>SIGNALS ({filtered.length})</p>
          <div style={s.list}>
            {filtered.map((sig, i) => {
              const level = sig.risk_level || sig.current_risk_level;
              const color = PIN_COLORS[level] || '#94A3B8';
              return (
                <div key={i} style={{ ...s.listItem, borderLeftColor: color }}>
                  <div style={{ flex: 1 }}>
                    <p style={s.listName}>{sig.name}</p>
                    <p style={s.listMeta}>{sig.incident_count_week} incidents/wk</p>
                  </div>
                  <span style={{ ...s.badge, color, background: color+'14', border: `1px solid ${color}44` }}>{level}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.mapWrap}>
          <MapContainer center={KARACHI_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {filtered.map((sig, i) => {
              const level = sig.risk_level || sig.current_risk_level;
              const color = PIN_COLORS[level] || '#94A3B8';
              return sig.lat && (
                <CircleMarker key={i} center={[sig.lat, sig.lng]} radius={10}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 2 }}>
                  <Popup>
                    <strong style={{ fontSize: 14 }}>{sig.name}</strong><br />
                    Risk: <strong style={{ color }}>{level}</strong><br />
                    {sig.incident_count_week} incidents/wk<br />
                    {sig.peak_hours?.length > 0 && `Peak: ${sig.peak_hours.join('h, ')}h`}
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:          { display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F7FF',
                   fontFamily: "'Inter','Segoe UI',sans-serif" },
  body:          { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:       { width: 280, background: '#FFFFFF', borderRight: '1px solid rgba(15,23,42,0.08)',
                   padding: 20, overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 },
  sideTitle:     { color: '#0D1829', fontSize: 18, fontWeight: 800, margin: '0 0 4px' },
  sideSub:       { color: '#94A3B8', fontSize: 12, margin: '0 0 16px' },
  countRow:      { display: 'flex', gap: 8, marginBottom: 16 },
  countCard:     { flex: 1, borderRadius: 10, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                   border: '1px solid rgba(15,23,42,0.06)' },
  filterLbl:     { color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', margin: '12px 0 6px' },
  filterRow:     { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 },
  filterBtn:     { background: '#EEF1F9', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8,
                   padding: '8px 14px', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer', textAlign: 'left' },
  filterBtnActive:{ background: '#0D1829', color: '#FFFFFF', borderColor: 'transparent' },
  list:          { display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 },
  listItem:      { background: '#EEF1F9', borderRadius: 10, padding: '10px 12px', display: 'flex',
                   alignItems: 'center', gap: 10, borderLeft: '3px solid', border: '1px solid rgba(15,23,42,0.08)', borderLeftWidth: 3 },
  listName:      { color: '#0D1829', fontSize: 13, fontWeight: 600, margin: '0 0 2px' },
  listMeta:      { color: '#94A3B8', fontSize: 11, margin: 0 },
  badge:         { padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800 },
  mapWrap:       { flex: 1, position: 'relative', minHeight: 0 },
};
