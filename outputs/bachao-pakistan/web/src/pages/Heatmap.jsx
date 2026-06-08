import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import { getAllHotspots, getAllSignals, listIncidents } from '../utils/api';
import SignalMarker from '../components/SignalMarker';
import Navbar from '../components/Navbar';

const KARACHI_CENTER = [24.8607, 67.0104];
const RISK_COLORS    = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#22C55E' };

export default function Heatmap() {
  const [hotspots,  setHotspots]  = useState([]);
  const [signals,   setSignals]   = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [layers, setLayers]       = useState({ hotspots: true, signals: true, incidents: false });
  const [timeFilter, setTimeFilter] = useState('week');

  useEffect(() => {
    getAllHotspots().then(r => setHotspots(r.data)).catch(console.warn);
    getAllSignals().then(r  => setSignals(r.data)).catch(console.warn);
    listIncidents().then(r  => setIncidents(r.data)).catch(console.warn);
  }, []);

  const highSignals = signals.filter(s => (s.risk_level || s.current_risk_level) === 'HIGH');
  const worstSignal = highSignals.sort((a,b) => (b.incident_count_week||0) - (a.incident_count_week||0))[0];

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>

        <div style={s.sidebar}>
          <h2 style={s.sideTitle}>Live Safety Map</h2>
          <p style={s.sideSub}>Karachi · Updated 24h</p>

          <div style={s.statsGrid}>
            {[
              { val: incidents.length || '—', label: 'Total incidents',  color: '#EF4444' },
              { val: hotspots.length  || '—', label: 'Hotspot zones',    color: '#F59E0B' },
              { val: highSignals.length,       label: 'HIGH signals',    color: '#EF4444' },
              { val: signals.length,           label: 'Total signals',   color: '#0EA5E9' },
            ].map((st, i) => (
              <div key={i} style={s.statBox}>
                <span style={{ ...s.statVal, color: st.color }}>{st.val}</span>
                <span style={s.statLbl}>{st.label}</span>
              </div>
            ))}
          </div>

          {worstSignal && (
            <div style={s.alertBox}>
              <p style={s.alertLbl}>⚠ HIGHEST RISK SIGNAL</p>
              <p style={s.alertName}>{worstSignal.name}</p>
              <p style={s.alertSub}>{worstSignal.incident_count_week} incidents/wk</p>
            </div>
          )}

          <p style={s.filterLbl}>TIME FILTER</p>
          <div style={s.filterRow}>
            {['today','week','month'].map(f => (
              <button key={f} style={{ ...s.filterBtn, ...(timeFilter===f ? s.filterBtnActive : {}) }} onClick={() => setTimeFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>

          <p style={s.filterLbl}>LAYERS</p>
          {[
            { key: 'hotspots', label: '🔴 Crime Hotspots', color: '#EF4444' },
            { key: 'signals',  label: '🟡 Risk Signals',   color: '#F59E0B' },
            { key: 'incidents',label: '📍 Incidents',      color: '#94A3B8' },
          ].map(l => (
            <label key={l.key} style={s.toggle}>
              <input type="checkbox" checked={layers[l.key]} onChange={() => setLayers(p => ({ ...p, [l.key]: !p[l.key] }))} />
              <span style={{ color: layers[l.key] ? '#0D1829' : '#94A3B8', marginLeft: 8, fontSize: 13, fontWeight: 500 }}>{l.label}</span>
            </label>
          ))}
        </div>

        <div style={s.mapWrap}>
          <MapContainer center={KARACHI_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {layers.hotspots && hotspots.map((h, i) => (
              <Circle key={i} center={[h.lat, h.lng]}
                radius={h.radius_meters || 600}
                pathOptions={{ color: RISK_COLORS[h.risk_level]||'#EF4444', fillOpacity: 0.18, weight: 1.5 }} />
            ))}
            {layers.signals && signals.map((sig, i) => (
              <SignalMarker key={i} signal={sig} />
            ))}
            {layers.incidents && incidents.map((inc, i) => inc.lat && (
              <Circle key={i} center={[inc.lat, inc.lng]}
                radius={120}
                pathOptions={{ color: '#94A3B8', fillOpacity: 0.3, weight: 1 }} />
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F7FF',
                  fontFamily: "'Inter','Segoe UI',sans-serif" },
  body:         { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:      { width: 280, background: '#FFFFFF', borderRight: '1px solid rgba(15,23,42,0.08)',
                  padding: 20, overflowY: 'auto', flexShrink: 0 },
  sideTitle:    { color: '#0D1829', fontSize: 18, fontWeight: 800, margin: '0 0 4px' },
  sideSub:      { color: '#94A3B8', fontSize: 12, margin: '0 0 16px' },
  statsGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 },
  statBox:      { background: '#EEF1F9', borderRadius: 10, padding: '12px 10px', border: '1px solid rgba(15,23,42,0.08)' },
  statVal:      { display: 'block', fontSize: 24, fontWeight: 800 },
  statLbl:      { display: 'block', color: '#94A3B8', fontSize: 11, marginTop: 2 },
  alertBox:     { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10, padding: 14, marginBottom: 16 },
  alertLbl:     { color: '#EF4444', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, margin: '0 0 4px' },
  alertName:    { color: '#0D1829', fontSize: 14, fontWeight: 700, margin: '0 0 2px' },
  alertSub:     { color: '#475569', fontSize: 12, margin: 0 },
  filterLbl:    { color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', margin: '12px 0 6px' },
  filterRow:    { display: 'flex', gap: 6, marginBottom: 12 },
  filterBtn:    { background: '#EEF1F9', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8,
                  padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' },
  filterBtnActive:{ background: '#0D1829', color: '#FFFFFF', borderColor: 'transparent' },
  toggle:       { display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer' },
  mapWrap:      { flex: 1, position: 'relative', minHeight: 0 },
};
