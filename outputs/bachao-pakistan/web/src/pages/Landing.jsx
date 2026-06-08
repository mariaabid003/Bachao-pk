import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Landing() {
  const nav = useNavigate();

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.hero}>
        <div style={s.badge}>🇵🇰 Built for Karachi</div>
        <h1 style={s.headline}>
          Predicting danger<br />
          <span style={{ color: '#EF4444' }}>before it finds you.</span>
        </h1>
        <p style={s.sub}>
          Karachi's first predictive urban safety platform —<br />
          for bikers, solo travellers, and everyone moving through the city at night.
        </p>
        <div style={s.btnRow}>
          <button style={s.btnPrimary}  onClick={() => nav('/heatmap')}>🗺️ View Live Map</button>
          <button style={s.btnSecondary} onClick={() => nav('/signals')}>🚦 Signal Risk Map</button>
          <button style={s.btnGhost}    onClick={() => nav('/report')}>+ Report Incident</button>
        </div>
      </div>

      <div style={s.statsBar}>
        {[
          { num: '847',  label: 'Incidents mapped',   color: '#EF4444' },
          { num: '23',   label: 'Hotspots this week',  color: '#F59E0B' },
          { num: '12',   label: 'Danger signals',      color: '#EF4444' },
          { num: '500K', label: 'Daily riders at risk', color: '#0EA5E9' },
        ].map((st, i) => (
          <div key={i} style={s.stat}>
            <span style={{ ...s.statNum, color: st.color }}>{st.num}</span>
            <span style={s.statLabel}>{st.label}</span>
          </div>
        ))}
      </div>

      <div style={s.features}>
        {[
          { icon: '🗺️', title: 'Live Heatmap',     desc: 'See exactly where crime is happening in Karachi right now. Updated every 24 hours.' },
          { icon: '⚠️', title: 'Signal Warnings',  desc: 'Get warned 200m before reaching a high-risk signal — in real time, while riding.' },
          { icon: '📍', title: 'Route Risk Score', desc: 'Before you leave, know your risk level. AI scores every route based on time, area, and history.' },
          { icon: '🆘', title: 'SOS in 3 Shakes', desc: 'Shake your phone 3 times and your trusted contacts are called and texted instantly.' },
        ].map((f, i) => (
          <div key={i} style={s.card}>
            <span style={{ fontSize: 32 }}>{f.icon}</span>
            <h3 style={s.cardTitle}>{f.title}</h3>
            <p style={s.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={s.cta}>
        <h2 style={s.ctaTitle}>Built for Pakistan. Ready now.</h2>
        <p style={s.ctaSub}>Open the live map to see what's happening in your area tonight.</p>
        <button style={s.btnPrimary} onClick={() => nav('/heatmap')}>Open Live Map →</button>
      </div>

      <footer style={s.footer}>
        <span>🛡️ Bachao Pakistan</span>
        <span style={{ color: '#CBD5E1' }}>|</span>
        <span>Karachi's Safety Intelligence Platform</span>
      </footer>
    </div>
  );
}

const s = {
  page:        { background: '#F5F7FF', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", color: '#0D1829' },
  hero:        { textAlign: 'center', padding: '80px 24px 60px', maxWidth: 760, margin: '0 auto' },
  badge:       { display: 'inline-block', background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.12)',
                 color: '#475569', fontSize: 13, padding: '6px 16px', borderRadius: 20, marginBottom: 24 },
  headline:    { fontSize: 56, fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-1px', color: '#0D1829' },
  sub:         { color: '#475569', fontSize: 18, lineHeight: 1.7, marginBottom: 36 },
  btnRow:      { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary:  { background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  btnSecondary:{ background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  btnGhost:    { background: 'transparent', color: '#475569', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  statsBar:    { display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
                 background: '#FFFFFF', borderTop: '1px solid rgba(15,23,42,0.08)', borderBottom: '1px solid rgba(15,23,42,0.08)' },
  stat:        { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 48px',
                 borderRight: '1px solid rgba(15,23,42,0.08)' },
  statNum:     { fontSize: 36, fontWeight: 800, marginBottom: 4 },
  statLabel:   { color: '#94A3B8', fontSize: 13 },
  features:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 1,
                 background: 'rgba(15,23,42,0.06)', borderTop: '1px solid rgba(15,23,42,0.08)',
                 borderBottom: '1px solid rgba(15,23,42,0.08)', margin: '60px 0' },
  card:        { background: '#FFFFFF', padding: '36px 32px' },
  cardTitle:   { color: '#0D1829', fontSize: 17, fontWeight: 700, margin: '16px 0 10px' },
  cardDesc:    { color: '#475569', fontSize: 14, lineHeight: 1.65 },
  cta:         { textAlign: 'center', padding: '80px 24px', maxWidth: 600, margin: '0 auto' },
  ctaTitle:    { fontSize: 36, fontWeight: 800, margin: '0 0 12px', color: '#0D1829' },
  ctaSub:      { color: '#475569', fontSize: 16, marginBottom: 32 },
  footer:      { display: 'flex', justifyContent: 'center', gap: 16, padding: '24px',
                 background: '#FFFFFF', color: '#94A3B8', fontSize: 13,
                 borderTop: '1px solid rgba(15,23,42,0.08)' },
};
