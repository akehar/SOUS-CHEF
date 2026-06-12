// SOUS-CHEF design system — "Warm Editorial"
// Ported from the Culinary-Lens design language: warm cream canvas, charcoal
// ink, brand gold + terracotta accents, serif display type over sans body.

export const colors = {
  // Canvas — warm cream/ivory
  bg: '#FAF8F4',
  bgElevated: '#F3EFE6',
  card: '#FFFFFF',
  cardPressed: '#FBF7EF',
  border: '#EDE7DB',

  // Brand
  gold: '#FBC02D', // hsl(45 100% 60%) — badges, highlights
  goldSoft: '#FCF3D8',
  terracotta: '#AD4329', // hsl(12 62% 42%) — primary CTAs, italic accents
  terracottaHover: '#963A23',
  terracottaSoft: '#F7E8E2',
  flame: '#AD4329', // alias kept for existing call sites
  flameSoft: '#F7E8E2',
  ember: '#8F3520',
  herb: '#3F8A4C',
  herbSoft: '#E7F2E8',
  butter: '#C8950B', // readable gold for text on cream
  wine: '#7C3AAE',
  wineSoft: '#F1E8F9',
  cream: '#FAF8F4',

  // Ink
  text: '#2D2D2D',
  textSecondary: '#5E5B54',
  textMuted: '#8E8A80',

  // Status
  success: '#3F8A4C',
  warning: '#C8950B',
  danger: '#C0392B',
  live: '#D63B2F',

  // Macros
  protein: '#3E7CB1',
  carbs: '#C8950B',
  fat: '#AD4329',
  calories: '#2D2D2D',
} as const;

// Font family names registered by @expo-google-fonts in app/_layout.tsx.
export const fonts = {
  serif: 'PlayfairDisplay_700Bold',
  serifBlack: 'PlayfairDisplay_800ExtraBold',
  serifItalic: 'PlayfairDisplay_500Medium_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  sansExtraBold: 'Inter_800ExtraBold',
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
  hero: { fontSize: 36, fontFamily: fonts.serifBlack, letterSpacing: -0.5, color: colors.text, lineHeight: 42 },
  title: { fontSize: 26, fontFamily: fonts.serif, letterSpacing: -0.3, color: colors.text, lineHeight: 32 },
  heading: { fontSize: 19, fontFamily: fonts.serif, color: colors.text },
  body: { fontSize: 15, fontFamily: fonts.sans, color: colors.text, lineHeight: 23 },
  bodySecondary: { fontSize: 15, fontFamily: fonts.sans, color: colors.textSecondary, lineHeight: 23 },
  caption: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.textMuted },
  label: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
    color: colors.terracotta,
    letterSpacing: 2.4,
    textTransform: 'uppercase' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#3A2E1E',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  lifted: {
    shadowColor: '#3A2E1E',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
} as const;
