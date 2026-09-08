import { Platform, } from 'react-native';

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
  // Dark & Neutral Typography (Light Mode)
  ink: '#1F1F1F',
  inkTint: '#3D3D3D',
  charcoal: '#2C2C2C',
  slate: '#4A4A4A',
  steel: '#6A6A6A',
  stone: '#8A8A8A',
  muted: '#A8A8A8',
  // Borders & Dividers (Light Mode)
  hairline: '#E5E5E5',
  hairlineSoft: '#EDEDED',
  hairlineStrong: '#C7C7C7',
  // Canvas & Surfaces (Light Mode)
  canvas: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceCream: '#FFF8E0',
  surfaceCreamSoft: '#FFFAEB',
  surfaceCode: '#1C1C1E',
  // Dark Mode Tokens (per specification)
  darkBackground: '#111111',
  darkSurface: '#1A1A1A',
  darkCard: '#202020',
  darkElevated: '#262626',
  darkBorder: '#333333',
  darkSoftBorder: '#292929',
  darkTextPrimary: '#FFFFFF',
  darkTextSecondary: '#D0D0D0',
  darkTextTertiary: '#9A9A9A',
  darkTextMuted: '#707070',
  darkCreamSurface: '#242017',
  darkCreamBorder: '#3E3524',
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
  infoLight: '#EFF6FF'
};

/**
 * Signature Sunset Gradient Stops
 * Red/Orange -> Saturated Orange -> Sunshine Yellow -> Warm Cream
 */
export const SunsetGradientColors = ['#FA520F', '#FFA110', '#FFB83E', '#FFD900', '#FFF8E0'];
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
    card: Palette.canvas,
    cardBorder: Palette.hairlineSoft,
    elevated: Palette.surface,
    // Typography
    text: Palette.ink,
    textPrimary: Palette.ink,
    textSecondary: Palette.slate,
    textTertiary: Palette.stone,
    textMuted: Palette.steel,
    textStone: Palette.stone,
    textDisabled: Palette.muted,
    textLight: Palette.canvas,
    onCream: Palette.onCream,
    onDark: Palette.onDark,
    // Inputs
    inputBackground: Palette.canvas,
    inputBorder: Palette.hairlineSoft,
    inputPlaceholder: Palette.stone,
    // Borders
    border: Palette.hairlineSoft,
    borderHairline: Palette.hairline,
    borderSoft: Palette.hairlineSoft,
    borderStrong: Palette.hairlineStrong,
    borderBeige: Palette.beigeDeep,
    // Navigation & Icons
    tint: Palette.primary,
    icon: Palette.steel,
    tabIconDefault: Palette.steel,
    tabIconSelected: Palette.primary,
    tabBarBackground: Palette.canvas,
    tabBarBorder: Palette.hairline,
    // Semantic
    success: Palette.success,
    successLight: Palette.successLight,
    warning: Palette.warning,
    warningLight: Palette.warningLight,
    error: Palette.error,
    errorLight: Palette.errorLight,
    info: Palette.info,
    infoLight: Palette.infoLight
  },
  dark: {
    primary: Palette.primary,
    primaryDark: Palette.primaryDeep,
    primaryLight: '#2C1A14',
    primaryMuted: '#3D251C',
    secondary: '#FFFFFF',
    accent: Palette.primary,
    // Surfaces
    background: Palette.darkBackground,
    // #111111
    surface: Palette.darkSurface,
    // #1A1A1A
    surfaceMuted: Palette.darkCard,
    // #202020
    surfaceCream: Palette.darkCreamSurface,
    // #242017
    surfaceCreamLight: '#1C1913',
    surfaceCreamDeeper: '#2E271B',
    surfaceCode: Palette.darkSurface,
    card: Palette.darkCard,
    // #202020
    cardBorder: Palette.darkBorder,
    // #333333
    elevated: Palette.darkElevated,
    // #262626

    // Typography
    text: Palette.darkTextPrimary,
    // #FFFFFF
    textPrimary: Palette.darkTextPrimary,
    // #FFFFFF
    textSecondary: Palette.darkTextSecondary,
    // #D0D0D0
    textTertiary: Palette.darkTextTertiary,
    // #9A9A9A
    textMuted: Palette.darkTextMuted,
    // #707070
    textStone: Palette.darkTextTertiary,
    textDisabled: '#555555',
    textLight: '#FFFFFF',
    onCream: Palette.darkTextPrimary,
    onDark: '#FFFFFF',
    // Inputs
    inputBackground: Palette.darkSurface,
    // #1A1A1A
    inputBorder: Palette.darkBorder,
    // #333333
    inputPlaceholder: Palette.darkTextMuted,
    // #707070

    // Borders
    border: Palette.darkBorder,
    // #333333
    borderHairline: Palette.darkSoftBorder,
    // #292929
    borderSoft: Palette.darkSoftBorder,
    borderStrong: '#404040',
    borderBeige: Palette.darkCreamBorder,
    // #3E3524

    // Navigation & Icons
    tint: Palette.primary,
    icon: Palette.darkTextSecondary,
    tabIconDefault: Palette.darkTextMuted,
    tabIconSelected: Palette.primary,
    tabBarBackground: Palette.darkSurface,
    // #1A1A1A
    tabBarBorder: Palette.darkBorder,
    // #333333

    // Semantic
    success: '#34D399',
    successLight: '#0E3A24',
    warning: '#FBBF24',
    warningLight: '#3D2800',
    error: '#F87171',
    errorLight: '#451212',
    info: '#60A5FA',
    infoLight: '#1E3A8A'
  }
};
/**
 * Editorial Serif font mapping: PP Editorial Old voice
 */
const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif'
});

/**
 * Clean Geometric UI font mapping: Inter voice
 */
const sansFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif'
});

/**
 * Monospace code font mapping: JetBrains Mono voice
 */
const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace'
});
export const Typography = {
  // Font Family mappings
  fontFamily: {
    serif: serifFont,
    sans: sansFont,
    mono: monoFont
  },
  // Editorial Display
  heroDisplay: {
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 38,
    letterSpacing: -1.0
  },
  displayLg: {
    fontFamily: serifFont,
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 34,
    letterSpacing: -0.8
  },
  heading1: {
    fontFamily: serifFont,
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 30,
    letterSpacing: -0.5
  },
  statDisplay: {
    fontFamily: serifFont,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 40,
    letterSpacing: -1.0
  },
  // Inter UI Headings
  heading2: {
    fontFamily: sansFont,
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 28,
    letterSpacing: -0.4
  },
  heading3: {
    fontFamily: sansFont,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24
  },
  heading4: {
    fontFamily: sansFont,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22
  },
  heading5: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21
  },
  subtitle: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22
  },
  // Inter Body & UI
  bodyMd: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23
  },
  bodyMdMedium: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 23
  },
  bodySm: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19
  },
  bodySmMedium: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19
  },
  caption: {
    fontFamily: sansFont,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17
  },
  captionBold: {
    fontFamily: sansFont,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17
  },
  micro: {
    fontFamily: sansFont,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15
  },
  microUppercase: {
    fontFamily: sansFont,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    letterSpacing: 1.0
  },
  buttonMd: {
    fontFamily: sansFont,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18
  },
  codeMd: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19
  },
  // Backward-compatible aliases for existing screens
  display: {
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 38,
    letterSpacing: -1.0
  },
  screenTitle: {
    fontFamily: serifFont,
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 30,
    letterSpacing: -0.5
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24
  },
  cardTitle: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21
  },
  body: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23
  },
  bodyMedium: {
    fontFamily: sansFont,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 23
  },
  secondary: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19
  },
  secondaryMedium: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19
  },
  button: {
    fontFamily: sansFont,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18
  }
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
  '4xl': 40
};
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  // Standard Mistral button and input radius
  lg: 12,
  // Standard Mistral card radius
  xl: 16,
  // Larger panels
  xxl: 20,
  pill: 9999,
  // Reserved strictly for badges/tags
  full: 9999
};
export const Shadows = {
  flat: {
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  floating: {
    shadowColor: '#FA520F',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3
  }
};