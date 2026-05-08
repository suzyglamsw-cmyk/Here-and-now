// Pixel-match theme port from web design_guidelines.json + index.css
// Midnight Social — Dark Mode Native

export const COLORS = {
  // Backgrounds (HSL from index.css)
  background: '#020617',          // slate-950 (--background: 222 47% 4%)
  backgroundLight: '#0F172A',     // slate-900 (--card: 222 47% 8%)
  backgroundLighter: '#1E293B',   // slate-800
  glassBg: 'rgba(15, 23, 42, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#94A3B8',       // slate-400
  textMuted: '#475569',           // slate-600
  textPlaceholder: '#64748B',     // slate-500
  textLabel: '#CBD5E1',           // slate-300

  // Brand
  primary: '#6366F1',             // indigo-500
  primaryDark: '#4F46E5',         // indigo-600
  primaryLight: '#818CF8',        // indigo-400
  pink: '#EC4899',                // pink-500
  pinkLight: '#F472B6',
  purple: '#A855F7',              // purple-500
  purpleLight: '#C084FC',
  emerald: '#10B981',
  emeraldLight: '#34D399',
  amber: '#F59E0B',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderActive: '#6366F1',

  // Inputs
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBgFocus: 'rgba(255, 255, 255, 0.1)',
};

export const FONTS = {
  heading: 'Outfit_700Bold',
  headingBold: 'Outfit_900Black',
  headingMedium: 'Outfit_500Medium',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemibold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  accent: 'Syne_700Bold',
};

export const SHADOWS = {
  glowIndigo: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  glowPink: {
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const RADIUS = { sm: 6, md: 8, lg: 12, xl: 16, '2xl': 20, '3xl': 24, full: 999 };
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 };

export const HERO_GRADIENT_COLORS = [
  'rgba(99, 102, 241, 0.15)',
  'rgba(2, 6, 23, 0.95)',
  'rgba(2, 6, 23, 1)',
];

export default { COLORS, FONTS, SHADOWS, RADIUS, SPACING, HERO_GRADIENT_COLORS };
