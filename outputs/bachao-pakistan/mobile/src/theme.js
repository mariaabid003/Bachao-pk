// Bachao Pakistan — Serene Oversight Design System
// Light pastel palette with dark navy navigation bar

export const C = {
  // Backgrounds
  bg:        '#F5F7FF',   // very light lavender-white page background
  surface:   '#FFFFFF',   // pure white cards
  surface2:  '#EEF1F9',   // slightly blue-tinted secondary surface
  nav:       '#080D1A',   // dark navy bottom nav bar

  // Borders / dividers
  border:    'rgba(15,23,42,0.08)',
  borderMed: 'rgba(15,23,42,0.14)',

  // Semantic / status colours
  red:       '#EF4444',   // HIGH risk / alert
  redBg:     'rgba(239,68,68,0.09)',
  redBorder: 'rgba(239,68,68,0.25)',

  orange:    '#F59E0B',   // MEDIUM risk / warning
  orangeBg:  'rgba(245,158,11,0.09)',

  green:     '#22C55E',   // LOW risk / safe
  greenBg:   'rgba(34,197,94,0.09)',

  teal:      '#0EA5E9',   // scanning / active state accent
  tealBg:    'rgba(14,165,233,0.09)',
  tealDark:  '#0369A1',

  navy:      '#1E3A5F',   // secondary accent (links, route line)
  purple:    '#7C3AED',

  // Text
  text:      '#0D1829',   // primary dark navy
  sub:       '#475569',   // secondary slate
  muted:     '#94A3B8',   // tertiary / placeholder
  white:     '#FFFFFF',
};

// Reusable style fragments
export const card = {
  backgroundColor: C.surface,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: C.border,
  padding: 18,
  shadowColor: '#0D1829',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
};

export const btn = {
  backgroundColor: C.text,
  borderRadius: 16,
  paddingVertical: 18,
  alignItems: 'center',
  justifyContent: 'center',
};

export const btnText = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '700',
  letterSpacing: 0.4,
};

export const btnOutline = {
  borderWidth: 1.5,
  borderColor: C.border,
  borderRadius: 16,
  paddingVertical: 17,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: C.surface,
};

export const input = {
  backgroundColor: C.surface,
  color: C.text,
  borderRadius: 14,
  paddingVertical: 15,
  paddingHorizontal: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: C.border,
};

export const label = {
  color: C.muted,
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 1.0,
  textTransform: 'uppercase',
  marginBottom: 10,
};

export const shadow = {
  shadowColor: '#0D1829',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
};
