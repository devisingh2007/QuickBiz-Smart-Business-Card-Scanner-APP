import { Platform } from 'react-native';

/**
 * Mistral AI Design System Palette
 * Source: DESIGN-mistral.ai.md
 */
export const Palette = {
  // Brand & Accent
  primary: '#FA520F',
  primaryDeep: '#CC3A05',
  onPrimary: '#FFFFFF',
  sunshine300: '#FFD06A',
  sunshine500: '#FFB83E',
  sunshine700: '#FFA110',
  sunshine800: '#FF8105',
  sunshine900: '#FF8A00',
  yellowSaturated: '#FFD900',

  // Spectrum stops
  block5: '#FFE295',
  block6: '#FFD900',
  block7: '#FF8105',

  // Cream & Warm Neutral Surfaces
  cream: '#FFF8E0',
  creamLight: '#FFFAEB',
  creamDeeper: '#FFF0C2',
  beigeDeep: '#E6D5A8',

  // Dark & Neutral Typography
  ink: '#1F1F1F',
  inkTint: '#3D3D3D',
  charcoal: '#2C2C2C',
  slate: '#4A4A4A',
  steel: '#6A6A6A',
  stone: '#8A8A8A',
  muted: '#A8A8A8',

  // Borders & Dividers
  hairline: '#E5E5E5',
  hairlineSoft: '#EDEDED',
  hairlineStrong: '#C7C7C7',

  // Canvas & Surfaces
  canvas: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceCream: '#FFF8E0',
  surfaceCreamSoft: '#FFFAEB',
  surfaceCode: '#1C1C1E',

  // Contrasts
  onDark: '#FFFFFF',
  onDarkMuted: '#A8A8A8',
  onCream: '#1F1F1F',
  footerCream: '#FFF8E0',
  link: '#FA520F',

  // Semantic
  success: '#1B8755',
  successLight: '#EDF8F2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#EFF6FF',
};

/**
 * Signature Sunset Gradient Stops
 * Red/Orange -> Saturated Orange -> Sunshine Yellow -> Warm Cream
 */
export const SunsetGradientColors = [
  '#FA520F',
  '#FFA110',
  '#FFB83E',
  '#FFD900',
  '#FFF8E0',
] as const;

export const Colors = {
  light: {
    primary: Palette.primary,
    primaryDark: Palette.primaryDeep,
    primaryLight: Palette.creamLight,
    primaryMuted: Palette.creamDeeper,
    secondary: Palette.ink,
    accent: Palette.primary,

    // Surfaces
    background: Palette.canvas,
    surface: Palette.canvas,
    surfaceMuted: Palette.surface,
    surfaceCream: Palette.cream,
    surfaceCreamLight: Palette.creamLight,
    surfaceCreamDeeper: Palette.creamDeeper,
    surfaceCode: Palette.surfaceCode,

    // Typography
    text: Palette.ink,
    textPrimary: Palette.ink,
    textSecondary: Palette.slate,
    textMuted: Palette.steel,
    textStone: Palette.stone,
    textDisabled: Palette.muted,
    textLight: Palette.canvas,
    onCream: Palette.onCream,
    onDark: Palette.onDark,

    // Borders
    border: Palette.hairlineSoft,
    borderHairline: Palette.hairline,
    borderStrong: Palette.hairlineStrong,
    borderBeige: Palette.beigeDeep,

    // Navigation & Icons
    tint: Palette.primary,
    icon: Palette.steel,
    tabIconDefault: Palette.steel,
    tabIconSelected: Palette.primary,

    // Semantic
    success: Palette.success,
    successLight: Palette.successLight,
    warning: Palette.warning,
    warningLight: Palette.warningLight,
    error: Palette.error,
    errorLight: Palette.errorLight,
    info: Palette.info,
    infoLight: Palette.infoLight,
  },
  dark: {
    primary: Palette.primary,
    primaryDark: Palette.primaryDeep,
    primaryLight: '#2C1A14',
    primaryMuted: '#3D251C',
    secondary: '#E5E5E5',
    accent: Palette.primary,

    // Surfaces
    background: '#121214',
    surface: Palette.surfaceCode,
    surfaceMuted: '#161618',
    surfaceCream: '#262118',
    surfaceCreamLight: '#1F1B14',
    surfaceCreamDeeper: '#332B1E',
    surfaceCode: '#161618',

    // Typography
    text: '#F5F5F5',
    textPrimary: '#F5F5F5',
    textSecondary: Palette.onDarkMuted,
    textMuted: Palette.steel,
    textStone: Palette.stone,
    textDisabled: '#555555',
    textLight: '#FFFFFF',
    onCream: '#F5F5F5',
    onDark: '#FFFFFF',

    // Borders
    border: '#2C2C2E',
    borderHairline: '#242426',
    borderStrong: '#3A3A3C',
    borderBeige: '#3D3425',

    // Navigation & Icons
    tint: Palette.primary,
    icon: Palette.onDarkMuted,
    tabIconDefault: Palette.steel,
    tabIconSelected: Palette.primary,

    // Semantic
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',
    info: '#60A5FA',
    infoLight: '#1E3A8A',
  },
};

export type ThemeColors = typeof Colors.light;

/**
 * Editorial Serif font mapping: PP Editorial Old voice
 */
const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

/**
 * Clean Geometric UI font mapping: Inter voice
 */
const sansFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

/**
 * Monospace code font mapping: JetBrains Mono voice
 */
const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const Typography = {
  // Font Family mappings
  fontFamily: {
    serif: serifFont,
    sans: sansFont,
    mono: monoFont,
  },

  // Editorial Display
  heroDisplay: {
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: '400' as const,
    lineHeight: 38,
    letterSpacing: -1.0,
  },
  displayLg: {
    fontFamily: serifFont,
    fontSize: 30,
    fontWeight: '400' as const,
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  heading1: {
    fontFamily: serifFont,
    fontSize: 26,
    fontWeight: '400' as const,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  statDisplay: {
    fontFamily: serifFont,
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 40,
    letterSpacing: -1.0,
  },

  // Inter UI Headings
  heading2: {
    fontFamily: sansFont,
    fontSize: 22,
    fontWeight: '500' as const,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  heading3: {
    fontFamily: sansFont,
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  heading4: {
    fontFamily: sansFont,
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  heading5: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 21,
  },
  subtitle: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },

  // Inter Body & UI
  bodyMd: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
  },
  bodyMdMedium: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 23,
  },
  bodySm: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 19,
  },
  bodySmMedium: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 19,
  },
  caption: {
    fontFamily: sansFont,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 17,
  },
  captionBold: {
    fontFamily: sansFont,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 17,
  },
  micro: {
    fontFamily: sansFont,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 15,
  },
  microUppercase: {
    fontFamily: sansFont,
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 15,
    letterSpacing: 1.0,
  },
  buttonMd: {
    fontFamily: sansFont,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  codeMd: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 19,
  },

  // Backward-compatible aliases for existing screens
  display: {
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: '400' as const,
    lineHeight: 38,
    letterSpacing: -1.0,
  },
  screenTitle: {
    fontFamily: serifFont,
    fontSize: 26,
    fontWeight: '400' as const,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  cardTitle: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 21,
  },
  body: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
  },
  bodyMedium: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 23,
  },
  secondary: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 19,
  },
  secondaryMedium: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 19,
  },
  button: {
    fontFamily: sansFont,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
};

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  sectionSm: 48,
  section: 64,
  sectionLg: 96,
  hero: 120,

  // Backward-compatible keys
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8, // Standard Mistral button and input radius
  lg: 12, // Standard Mistral card radius
  xl: 16, // Larger panels
  xxl: 20,
  pill: 9999, // Reserved strictly for badges/tags
  full: 9999,
};

export const Shadows = {
  flat: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  floating: {
    shadowColor: '#FA520F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
};
