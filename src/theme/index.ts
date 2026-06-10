// SOUS-CHEF design system — "Midnight Kitchen"
// Deep charcoal canvas, copper-flame accents, fresh-herb greens.

export const colors = {
  // Canvas
  bg: '#0E0F13',
  bgElevated: '#16181F',
  card: '#1C1F28',
  cardPressed: '#232733',
  border: '#2A2E3A',

  // Brand
  flame: '#E8833A', // copper flame — primary accent
  flameSoft: '#3A2A1C',
  ember: '#C9542E',
  herb: '#7BC47F', // fresh herb green — success / live
  herbSoft: '#1E2E22',
  butter: '#F2C94C', // warm highlight
  wine: '#9B5DE5', // wine pairing accent
  wineSoft: '#2A2238',
  cream: '#F5EFE6',

  // Text
  text: '#F2F0EC',
  textSecondary: '#A8ACB8',
  textMuted: '#6C7180',

  // Status
  success: '#7BC47F',
  warning: '#F2C94C',
  danger: '#E5604C',
  live: '#FF4D5E',

  // Macros
  protein: '#5DA9E9',
  carbs: '#F2C94C',
  fat: '#E8833A',
  calories: '#E5604C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const type = {
  hero: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8, color: colors.text },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5, color: colors.text },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 22 },
  bodySecondary: { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 22 },
  caption: { fontSize: 12.5, fontWeight: '500' as const, color: colors.textMuted },
  label: {
    fontSize: 11.5,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
