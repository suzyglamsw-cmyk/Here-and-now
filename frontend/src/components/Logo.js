import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../utils/theme';

// Faithful port of web Logo.js — "Here & N [clock-O] w" with purple shimmer text.
// RN doesn't support animated background-clip text gradient, so we use solid purple with
// the clock as the visual focal point (closest cross-platform match).

const ClockO = ({ size = 20, color = '#C084FC' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" fill="none" />
    <Line x1="12" y1="12" x2="7.5" y2="15.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="12" y1="12" x2="12" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
);

const SIZES = {
  small: { text: 16, clock: 14 },
  default: { text: 20, clock: 18 },
  large: { text: 24, clock: 22 },
  hero: { text: 36, clock: 32 },
};

export function Logo({ size = 'default', showText = true }) {
  const s = SIZES[size];
  const textStyle = { fontSize: s.text, color: COLORS.purpleLight, fontFamily: FONTS.headingBold, letterSpacing: -0.5 };
  return (
    <View style={styles.row}>
      {showText && <Text style={textStyle}>Here & N</Text>}
      <ClockO size={s.clock} />
      {showText && <Text style={textStyle}>w</Text>}
    </View>
  );
}

export function LogoIcon({ size = 40 }) {
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.pink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.iconBox, { width: size, height: size, borderRadius: size * 0.3 }]}
    >
      <ClockO size={size * 0.5} color="#fff" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBox: { alignItems: 'center', justifyContent: 'center' },
});

export default Logo;
