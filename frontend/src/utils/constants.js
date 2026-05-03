import Constants from 'expo-constants';

// API Configuration
// Try multiple sources to be resilient across dev/release builds:
// 1. expo-constants extra (from app.json extra.apiBaseUrl at build time)
// 2. Hardcoded fallback (so app never crashes with undefined baseURL)
const PROD_API_URL = 'https://herenow-eas-android.emergent.host';
export const API_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  Constants.manifest?.extra?.apiBaseUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl ||
  PROD_API_URL;

// Google Maps API Key (runtime use)
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// App Constants
export const APP_NAME = 'Here & Now';
export const APP_VERSION = '1.0.0';

// Colors - matching web app theme
export const COLORS = {
  // Primary
  primary: '#a855f7',
  primaryDark: '#7c3aed',
  primaryLight: '#c084fc',

  // Accent
  accent: '#ec4899',
  accentLight: '#f472b6',

  // Gender Colors
  female: '#FF2D8D',
  male: '#3A7BFF',
  rainbow: '#8B5CF6',

  // Backgrounds
  background: '#0f0a1e',
  backgroundLight: '#1a1425',
  card: 'rgba(255, 255, 255, 0.05)',
  cardHover: 'rgba(255, 255, 255, 0.08)',

  // Text
  text: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // Status
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Font Sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
