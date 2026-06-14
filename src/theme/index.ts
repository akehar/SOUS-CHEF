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

  // Ink — high-contrast editorial near-black on warm ivory
  ink: '#1A1714',
  text: '#211E1A',
  textSecondary: '#5E5B54',
  textMuted: '#8E8A80',
  hairline: '#1A1714', // 1px rules, used at low opacity
  rule: 'rgba(26,23,20,0.16)',

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
  serifBlack: 'PlayfairDisplay_900Black',
  serifSemi: 'PlayfairDisplay_600SemiBold',
  serifItalic: 'PlayfairDisplay_500Medium_Italic',
  serifItalicBold: 'PlayfairDisplay_700Bold_Italic',
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
  // Editorial display — high-contrast didone, tight leading
  display: { fontSize: 46, fontFamily: fonts.serifBlack, letterSpacing: -1, color: colors.ink, lineHeight: 48 },
  hero: { fontSize: 36, fontFamily: fonts.serifBlack, letterSpacing: -0.6, color: colors.ink, lineHeight: 40 },
  title: { fontSize: 26, fontFamily: fonts.serif, letterSpacing: -0.3, color: colors.ink, lineHeight: 31 },
  heading: { fontSize: 19, fontFamily: fonts.serif, color: colors.ink },
  // Italic serif "deck" — the standfirst line under a headline
  deck: { fontSize: 17, fontFamily: fonts.serifItalic, color: colors.textSecondary, lineHeight: 25 },
  body: { fontSize: 15, fontFamily: fonts.sans, color: colors.text, lineHeight: 24 },
  bodySecondary: { fontSize: 15, fontFamily: fonts.sans, color: colors.textSecondary, lineHeight: 24 },
  caption: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.textMuted },
  // Tracked all-caps kicker / eyebrow
  kicker: {
    fontSize: 10.5,
    fontFamily: fonts.sansBold,
    color: colors.terracotta,
    letterSpacing: 2.8,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
    color: colors.terracotta,
    letterSpacing: 2.4,
    textTransform: 'uppercase' as const,
  },
  // Big serif index numeral for contents lists
  indexNum: { fontSize: 30, fontFamily: fonts.serifBlack, color: colors.ink, letterSpacing: -1 },
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
