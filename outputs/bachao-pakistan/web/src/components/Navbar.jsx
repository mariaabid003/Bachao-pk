import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const nav = useNavigate();
  const loc = useLocation();

  const links = [
    { label: 'Live Map',     path: '/heatmap'   },
    { label: 'Safe Signals', path: '/signals'   },
    { label: 'Dashboard',    path: '/dashboard' },
    { label: 'Report',       path: '/report'    },
  ];

  return (
    <nav style={s.nav}>
      <div style={s.logo} onClick={() => nav('/')}>
        <span style={{ fontSize: 22 }}>🛡️</span>
        <span style={s.brand}>Bachao Pakistan</span>
      </div>
      <div style={s.links}>
        {links.map(l => (
          <button key={l.path}
            style={{ ...s.link, ...(loc.pathname === l.path ? s.linkActive : {}) }}
            onClick={() => nav(l.path)}>
            {l.label}
          </button>
        ))}
        <button style={s.ctaBtn} onClick={() => nav('/heatmap')}>View Live Map</button>
      </div>
    </nav>
  );
}

const s = {
  nav:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
               padding: '0 40px', height: 64, background: '#080D1A',
               borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 100 },
  logo:      { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  brand:     { color: '#ffffff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' },
  links:     { display: 'flex', alignItems: 'center', gap: 4 },
  link:      { background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 14,
               cursor: 'pointer', padding: '7px 13px', borderRadius: 8, fontWeight: 500 },
  linkActive:{ color: '#ffffff', background: 'rgba(255,255,255,0.10)' },
  ctaBtn:    { background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8,
               padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginLeft: 8 },
};
