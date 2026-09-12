/* ==========================================================================
   KrishiMitra AI — Mobile Design System & Theme Tokens
   Tailored for Indian Farmers: High contrast, large touch targets, accessible.
   ========================================================================== */

export const Colors = {
  // Primary Palette
  primary: '#2E7D32',       // Forest Green - Main brand color
  primaryDark: '#1B5E20',   // Dark Emerald Green - High contrast buttons & callouts
  primaryLight: '#E8F5E9',  // Mint Tint - Background highlight
  accent: '#81C784',        // Leaf Green accent

  // Neutral Palette
  background: '#F4F6F4',    // Soft off-white page background
  surface: '#FFFFFF',       // Clean white card background
  surfaceVariant: '#EFEFEF',// Light grey divider / placeholder
  border: '#D8E2DA',        // Subtle card border

  // Text Colors
  textPrimary: '#1A251E',   // Deep green-grey for main text (accessible ratio 7+:1)
  textSecondary: '#4A5D50', // Medium grey for captions & subtitles
  textMuted: '#75887B',     // Light grey for metadata
  textOnPrimary: '#FFFFFF', // White text on dark buttons

  // Action / State Palette
  success: '#2E7D32',       // Green for positive status
  warning: '#ED6C02',       // Amber for cautions / offline notices
  error: '#D32F2F',         // Red for errors
  info: '#0288D1',          // Blue for information cards
  
  // Custom Feature Badges
  voiceAction: '#E8F5E9',   // Light green voice pill
  callAi: '#E8F5E9',        // Call AI card background
  weatherCard: '#E1F5FE',   // Weather sky blue tint
  mandiCard: '#FFF8E1'      // Mandi warm gold tint
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    title: 32,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    title: 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenPadding: 16,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const ComponentSize = {
  minTouchTarget: 48,       // Minimum 48dp for accessibility
  buttonHeight: 52,         // Prominent farmer-friendly buttons
  inputHeight: 52,
  headerHeight: 64,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
};

export const Elevation = {
  low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  high: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  }
};
