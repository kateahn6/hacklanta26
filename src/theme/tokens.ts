export const Colors = {
  // Brand palette
  black: '#000000',
  navy: '#162C5E',
  slate: '#4B5F8C',
  sky: '#4F94D7',
  gray: '#A5A5A5',

  // Surfaces (faint tints of the brand blues)
  background: '#F3F6FB',
  backgroundDeep: '#E4EAF3',
  surface: '#FFFFFF',
  navySoft: '#E3E8F3',
  skySoft: '#E4EFFA',

  // Text. Brand gray is too light for readable text on white, so secondary text uses a darker slate-gray.
  text: '#000000',
  textMuted: '#5D6574',

  hairline: 'rgba(22, 44, 94, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  /** Dark translucent fill for labels sitting on photos. */
  scrim: 'rgba(22, 44, 94, 0.82)',
  white: '#FFFFFF',
  danger: '#B42318',
} as const;

export const Fonts = {
  sans: 'Inter_400Regular',
  sansItalic: 'Inter_400Regular_Italic',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
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
