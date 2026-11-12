/**
 * src/styles/theme.js
 * Global design tokens for Naira Finance App
 */

export const COLORS = {
  // Brand
  primary:        '#1B5E20',   // Deep green – money
  primaryLight:   '#2E7D32',
  primaryDark:    '#145A32',
  accent:         '#F9A825',   // Gold/Naira yellow
  accentLight:    '#FDD835',

  // Status
  income:         '#2E7D32',
  expense:        '#C62828',
  savings:        '#1565C0',
  budget:         '#6A1B9A',

  // Alert levels
  safe:           '#4CAF50',
  caution:        '#FFC107',
  warning:        '#FF9800',
  danger:         '#F44336',

  // Neutrals
  white:          '#FFFFFF',
  background:     '#F5F5F5',
  surface:        '#FFFFFF',
  border:         '#E0E0E0',
  divider:        '#EEEEEE',
  shadow:         '#00000020',

  // Text
  textPrimary:    '#212121',
  textSecondary:  '#757575',
  textMuted:      '#9E9E9E',
  textOnPrimary:  '#FFFFFF',
  textOnAccent:   '#212121',

  // Dark overlays
  overlay:        '#00000080',
};

export const FONTS = {
  regular:    'System',
  medium:     'System',
  bold:       'System',
  sizes: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  24,
    hero: 32,
  },
  weights: {
    regular:    '400',
    medium:     '500',
    semibold:   '600',
    bold:       '700',
    extrabold:  '800',
  },
};

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
};

export const RADIUS = {
  sm:   6,
  md:   12,
  lg:   18,
  xl:   24,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
};
