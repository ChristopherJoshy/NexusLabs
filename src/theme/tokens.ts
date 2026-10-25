import { Platform, type ViewStyle } from 'react-native';

/**
 * NexusLabs design tokens.
 *
 * The interface is editorial utility in strict monochrome: paper, ink, and
 * greys only. Hierarchy comes from contrast, type, fill/outline, and motion.
 * Semantic status tokens stay grayscale and are always paired with a label,
 * icon, or shape so state never depends on hue.
 */

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
  colossal: 64,
} as const;

export const radii = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 28,
  xxl: 36,
  pill: 999,
} as const;

export const type = {
  serif: {
    fontSize: 42,
    lineHeight: 43,
    fontFamily: fonts.serif,
    letterSpacing: -1.1,
  },
  serifItalic: {
    fontSize: 42,
    lineHeight: 43,
    fontFamily: fonts.serifItalic,
    letterSpacing: -1.1,
  },
  display: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: fonts.extrabold,
    letterSpacing: -1.2,
  },
  h1: { fontSize: 29, lineHeight: 34, fontFamily: fonts.extrabold, letterSpacing: -0.9 },
  h2: { fontSize: 23, lineHeight: 28, fontFamily: fonts.bold, letterSpacing: -0.5 },
  h3: { fontSize: 18, lineHeight: 24, fontFamily: fonts.bold, letterSpacing: -0.25 },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontFamily: fonts.medium },
  bodySemibold: { fontSize: 15, lineHeight: 22, fontFamily: fonts.semibold },
  small: { fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  smallMedium: { fontSize: 13, lineHeight: 19, fontFamily: fonts.medium },
  caption: { fontSize: 11.5, lineHeight: 16, fontFamily: fonts.medium, letterSpacing: 0.1 },
  label: {
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: fonts.bold,
    letterSpacing: 1.15,
    textTransform: 'uppercase' as const,
  },
  numeric: {
    fontSize: 44,
    lineHeight: 46,
    fontFamily: fonts.extrabold,
    letterSpacing: -2,
    fontVariant: ['tabular-nums' as const],
  },
  numericSmall: {
    fontSize: 27,
    lineHeight: 30,
    fontFamily: fonts.extrabold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums' as const],
  },
} as const;

export const lightColors = {
  background: '#F5F5F5',
  backgroundAlt: '#ECECEC',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#EFEFEF',
  text: '#0A0A0A',
  textSecondary: '#555555',
  textMuted: '#666666',
  textInverse: '#FFFFFF',
  border: '#E2E2E2',
  borderStrong: '#C6C6C6',
  controlBorder: '#808080',
  primary: '#0A0A0A',
  primaryPressed: '#2A2A2A',
  primarySoft: '#E9E9E9',
  primarySoftText: '#0A0A0A',
  accent: '#0A0A0A',
  accentPressed: '#2A2A2A',
  accentSoft: '#E8E8E8',
  accentSoftText: '#0A0A0A',
  onAccent: '#FFFFFF',
  hero: '#0A0A0A',
  heroRaised: '#1C1C1C',
  heroText: '#FFFFFF',
  heroMuted: '#B8B8B8',
  heroAccent: '#FFFFFF',
  heroBorder: '#333333',
  success: '#333333',
  successSoft: '#F0F0F0',
  warning: '#5E5E5E',
  warningSoft: '#E3E3E3',
  danger: '#000000',
  dangerSoft: '#D2D2D2',
  info: '#5A5A5A',
  infoSoft: '#EDEDED',
  overlay: 'rgba(0, 0, 0, 0.48)',
  shadow: '#000000',
  skeleton: '#E6E6E6',
  skeletonHighlight: '#F5F5F5',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  background: '#000000',
  backgroundAlt: '#0B0B0B',
  surface: '#111111',
  surfaceRaised: '#181818',
  surfaceSunken: '#0A0A0A',
  text: '#F7F7F7',
  textSecondary: '#C2C2C2',
  textMuted: '#9A9A9A',
  textInverse: '#0A0A0A',
  border: '#262626',
  borderStrong: '#4A4A4A',
  controlBorder: '#6B6B6B',
  primary: '#F7F7F7',
  primaryPressed: '#D0D0D0',
  primarySoft: '#242424',
  primarySoftText: '#F7F7F7',
  accent: '#FFFFFF',
  accentPressed: '#D8D8D8',
  accentSoft: '#2A2A2A',
  accentSoftText: '#FFFFFF',
  onAccent: '#0A0A0A',
  hero: '#F5F5F5',
  heroRaised: '#FFFFFF',
  heroText: '#0A0A0A',
  heroMuted: '#5A5A5A',
  heroAccent: '#0A0A0A',
  heroBorder: '#D4D4D4',
  success: '#D6D6D6',
  successSoft: '#222222',
  warning: '#A8A8A8',
  warningSoft: '#2C2C2C',
  danger: '#FFFFFF',
  dangerSoft: '#3A3A3A',
  info: '#9A9A9A',
  infoSoft: '#1C1C1C',
  overlay: 'rgba(0, 0, 0, 0.72)',
  shadow: '#000000',
  skeleton: '#1E1E1E',
  skeletonHighlight: '#2A2A2A',
};

export const motion = {
  fast: 140,
  base: 240,
  slow: 420,
  stagger: 55,
  spring: { duration: 420, dampingRatio: 0.82 },
  springSnappy: { duration: 260, dampingRatio: 0.9 },
  easeOut: [0.23, 1, 0.32, 1] as const,
  easeInOut: [0.77, 0, 0.175, 1] as const,
} as const;

export type Theme = {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  fonts: typeof fonts;
  type: typeof type;
  motion: typeof motion;
  shadow: {
    card: ViewStyle;
    raised: ViewStyle;
    floating: ViewStyle;
  };
};

const shadows = {
  card: {
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
  },
  raised: {
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.10)',
  },
  floating: {
    boxShadow: '0 22px 54px rgba(0, 0, 0, 0.16)',
  },
} satisfies Record<string, ViewStyle>;

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  spacing,
  radii,
  fonts,
  type,
  motion,
  shadow: shadows,
};

export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  spacing,
  radii,
  fonts,
  type,
  motion,
  shadow: {
    card: { boxShadow: '0 12px 32px rgba(0, 0, 0, 0.32)' },
    raised: { boxShadow: '0 18px 44px rgba(0, 0, 0, 0.42)' },
    floating: { boxShadow: '0 24px 56px rgba(0, 0, 0, 0.52)' },
  },
};
