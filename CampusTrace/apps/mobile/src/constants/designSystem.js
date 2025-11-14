/**
 * CampusTrace Design System
 * Centralized design tokens for consistent UI/UX
 */

import { Platform } from "react-native";

// ============= COLORS =============
export const Colors = {
  // Primary Brand Colors
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  // Neutral Grays
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Semantic Colors
  success: {
    light: "#D1FAE5",
    main: "#10B981",
    dark: "#065F46",
  },
  warning: {
    light: "#FEF3C7",
    main: "#F59E0B",
    dark: "#92400E",
  },
  error: {
    light: "#FEE2E2",
    main: "#EF4444",
    dark: "#991B1B",
  },
  info: {
    light: "#DBEAFE",
    main: "#3B82F6",
    dark: "#1E40AF",
  },

  // Special
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

// ============= TYPOGRAPHY =============
export const Typography = {
  // Font Families
  fontFamily: {
    regular: Platform.select({
      ios: "System",
      android: "Roboto",
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }),
    medium: Platform.select({
      ios: "System",
      android: "Roboto-Medium",
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }),
    bold: Platform.select({
      ios: "System",
      android: "Roboto-Bold",
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }),
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  h5: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },

  // Body Text
  bodyLarge: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },

  // UI Elements
  button: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  overline: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
};

// ============= SPACING =============
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// ============= BORDER RADIUS =============
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// ============= SHADOWS =============
export const Shadows = {
  none: Platform.select({
    ios: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: { elevation: 0 },
    web: { boxShadow: "none" },
  }),

  sm: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    web: { boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" },
  }),

  md: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: { elevation: 4 },
    web: { boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)" },
  }),

  lg: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: { elevation: 8 },
    web: { boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.15)" },
  }),

  xl: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: { elevation: 12 },
    web: { boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.2)" },
  }),
};

// ============= LAYOUT =============
export const Layout = {
  // Container widths
  containerMaxWidth: 1200,
  contentMaxWidth: 800,

  // Touch targets (minimum for accessibility)
  minTouchTarget: 44,

  // Common dimensions
  headerHeight: 60,
  tabBarHeight: 56,
  inputHeight: 48,
  buttonHeight: 48,
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
};

// ============= ANIMATIONS =============
export const Animations = {
  // Duration (in milliseconds)
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },

  // Easing
  easing: {
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
};

// ============= HELPER FUNCTIONS =============

/**
 * Get shadow style for current platform
 * @param {'sm' | 'md' | 'lg' | 'xl'} size
 */
export const getShadow = (size = "md") => {
  return Shadows[size] || Shadows.md;
};

/**
 * Get responsive spacing
 * @param {number} base - Base spacing value
 * @param {number} multiplier - Multiplier for larger screens
 */
export const getResponsiveSpacing = (base, multiplier = 1.5) => {
  return Platform.select({
    ios: base,
    android: base,
    web: base * multiplier,
  });
};

/**
 * Get color with opacity
 * @param {string} color - Hex color
 * @param {number} opacity - Opacity (0-1)
 */
export const getColorWithOpacity = (color, opacity) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ============= EXPORT DEFAULT =============
export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  Animations,
  getShadow,
  getResponsiveSpacing,
  getColorWithOpacity,
};
