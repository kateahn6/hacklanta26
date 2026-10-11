export const Colors = {
  cream: '#F1E8D8',
  creamDeep: '#E8DCC6',
  paper: '#FBF7EF',
  softBlack: '#211F1C',
  cherry: '#4A1018',
  cherrySoft: '#F0DCDA',
  blackOlive: '#292E1E',
  olive: '#59633A',
  sage: '#C8CDB7',
  sageSoft: '#E1E4D6',
  caramel: '#D4B38B',
  chocolate: '#4A3027',
  muted: '#6E665C',
  hairline: 'rgba(33, 31, 28, 0.12)',
  overlay: 'rgba(33, 31, 28, 0.45)',
  white: '#FFFFFF',
  danger: '#9B2C2C',
} as const;

export const Fonts = {
  serif: 'DMSerifDisplay_400Regular',
  serifItalic: 'DMSerifDisplay_400Regular_Italic',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Horizontal page gutter used by every screen. */
export const Gutter = Spacing.xl;

/** Minimum touch target (iOS HIG / Material). */
export const HitTarget = 44;
