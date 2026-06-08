import { useState } from 'react';
import { reportIncident } from '../utils/api';
import Navbar from '../components/Navbar';

const INCIDENT_TYPES = [
  { id: 'phone_snatching', label: '🏍️ Phone Snatching (Biker)' },
  { id: 'ride_hailing',    label: '🚗 Ride-Hailing Incident'   },
  { id: 'mugging',         label: '👊 Street Mugging'          },
  { id: 'signal_robbery',  label: '🚦 Signal Robbery'          },
  { id: 'harassment',      label: '😰 Harassment'              },
  { id: 'other',           label: '📋 Other'                   },
];

const KARACHI_SIGNALS = [
  'Teen Talwar Signal','Numaish Signal','Hassan Square','Baloch Colony Signal',
  'Gulshan Chowrangi','Tariq Road Signal','Shahra-e-Faisal Signal','Nursery Signal',
  'Nagan Chowrangi','Other',
];

export default function Report() {
  const [type,   setType]   = useState('');
  const [sig,    setSig]    = useState('');
  const [desc,   setDesc]   = useState('');
  const [anon,   setAnon]   = useState(true);
  const [status, setStatus] = useState('');

  const submit = async e => {
    e.preventDefault(); setStatus('Submitting...');
    try {
      await reportIncident({ type, lat: 24.8607, lng: 67.0104, signal_name: sig || null, description: desc, anonymous: anon });
      setStatus('✅ Report submitted. Thank you for keeping Karachi safer.');
      setType(''); setSig(''); setDesc('');
    } catch { setStatus('❌ Error submitting. Please try again.'); }
  };

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <Text24>📋</Text24>
            <div>
              <h1 style={s.title}>Report an Incident</h1>
              <p style={s.sub}>Help keep Karachi safer by reporting what you witnessed.</p>
            </div>
          </div>

          <form onSubmit={submit}>
            <p style={s.lbl}>INCIDENT TYPE</p>
            <div style={s.typeGrid}>
              {INCIDENT_TYPES.map(t => (
                <button type="button" key={t.id}
                  style={{ ...s.typeBtn, ...(type===t.id ? s.typeBtnActive : {}) }}
                  onClick={() => setType(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            <p style={s.lbl}>SIGNAL / LOCATION</p>
            <select style={s.select} value={sig} onChange={e => setSig(e.target.value)}>
              <option value="">Select signal or location</option>
              {KARACHI_SIGNALS.map(sg => <option key={sg} value={sg}>{sg}</option>)}
            </select>

            <p style={s.lbl}>DESCRIPTION</p>
            <textarea style={s.textarea} rows={4} value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe what happened (optional)" />

            <label style={s.anonRow}>
              <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ marginRight: 10 }} />
              <span style={{ color: '#475569', fontSize: 14 }}>Submit anonymously</span>
            </label>

            <button type="submit" disabled={!type} style={{ ...s.submitBtn, opacity: !type ? 0.4 : 1 }}>
              Submit Report
            </button>

            {status && (
              <div style={{ ...s.statusBox, background: status.startsWith('✅') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                borderColor: status.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}>
                <p style={{ color: status.startsWith('✅') ? '#22C55E' : '#EF4444', margin: 0, fontWeight: 600 }}>{status}</p>
              </div>
            )}
          </form>
        </div>

        <div style={s.infoPanel}>
          <h2 style={s.infoTitle}>Why report?</h2>
          <p style={s.infoText}>Every report helps our AI learn Karachi's danger patterns more accurately. Your data is used anonymously to make predictions that protect riders and pedestrians.</p>
          <div style={s.infoStats}>
            {[
              { num: '847+', label: 'incidents mapped' },
              { num: '23',   label: 'danger zones identified' },
              { num: '100%', label: 'anonymous by default' },
            ].map((st, i) => (
              <div key={i} style={s.infoStat}>
                <span style={s.infoNum}>{st.num}</span>
                <span style={s.infoLbl}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Text24({ children }) {
  return <span style={{ fontSize: 32 }}>{children}</span>;
}

const s = {
  page:          { background: '#F5F7FF', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif" },
  wrap:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(480px,100%),1fr))',
                   gap: 24, maxWidth: 960, margin: '0 auto', padding: '40px 24px' },
  card:          { background: '#FFFFFF', borderRadius: 16, padding: 32, border: '1px solid rgba(15,23,42,0.08)',
                   boxShadow: '0 4px 24px rgba(13,24,41,0.06)' },
  cardHeader:    { display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 },
  title:         { color: '#0D1829', fontSize: 24, fontWeight: 800, margin: '0 0 6px' },
  sub:           { color: '#475569', fontSize: 14, margin: 0 },
  lbl:           { color: '#94A3B8', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', margin: '20px 0 8px 0' },
  typeGrid:      { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 },
  typeBtn:       { background: '#EEF1F9', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 10,
                   padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer', textAlign: 'left' },
  typeBtnActive: { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444', fontWeight: 600 },
  select:        { width: '100%', background: '#EEF1F9', border: '1px solid rgba(15,23,42,0.08)',
                   borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#0D1829', cursor: 'pointer' },
  textarea:      { width: '100%', background: '#EEF1F9', border: '1px solid rgba(15,23,42,0.08)',
                   borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#0D1829',
                   resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  anonRow:       { display: 'flex', alignItems: 'center', margin: '16px 0', cursor: 'pointer' },
  submitBtn:     { width: '100%', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 12,
                   padding: '15px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  statusBox:     { marginTop: 16, padding: '14px 16px', borderRadius: 10, border: '1px solid' },
  infoPanel:     { background: '#FFFFFF', borderRadius: 16, padding: 32, border: '1px solid rgba(15,23,42,0.08)',
                   boxShadow: '0 4px 24px rgba(13,24,41,0.06)', alignSelf: 'start' },
  infoTitle:     { color: '#0D1829', fontSize: 20, fontWeight: 700, margin: '0 0 12px' },
  infoText:      { color: '#475569', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' },
  infoStats:     { display: 'flex', flexDirection: 'column', gap: 12 },
  infoStat:      { display: 'flex', alignItems: 'baseline', gap: 10 },
  infoNum:       { color: '#EF4444', fontSize: 28, fontWeight: 800 },
  infoLbl:       { color: '#94A3B8', fontSize: 13 },
};
