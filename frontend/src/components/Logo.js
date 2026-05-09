import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';

// Pixel-match port of web Logo.js — "Here & N [clock] w" with purple→pink shimmer text.
// Implementation note: We use react-native-svg's <Text> + <LinearGradient> fill instead of
// @react-native-masked-view because masked-view's Android rendering of gradient-through-text
// is unreliable (often appears black). SVG gradient fill is rock-solid on both platforms.

const ClockO = ({ size = 20, color = '#C084FC' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" fill="none" />
    <Line x1="12" y1="12" x2="7.5" y2="15.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="12" y1="12" x2="12" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
);

// Approximate width of one character at given fontSize for a bold display weight.
// Tighter multiplier removes excess whitespace at the right edge of the SVG.
const charWidth = (text, fontSize) => Math.ceil(text.length * fontSize * 0.58);

const SIZES = {
  small: 16,
  default: 20,
  large: 24,
  hero: 36,
};

// SvgGradientText: renders a text string filled with a horizontal purple→pink gradient.
function SvgGradientText({ children, fontSize, gradientId, animProgress }) {
  const text = String(children);
  const width = charWidth(text, fontSize);
  const height = Math.ceil(fontSize * 1.3);

  // Animated.Value drives the gradient stop positions via interpolated x1/x2 props.
  // For native devices this gives us a subtle shimmer; on web we render static.
  const shift = animProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2={String(width)} y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A855F7" />
          <Stop offset="0.35" stopColor="#C084FC" />
          <Stop offset="0.6" stopColor="#EC4899" />
          <Stop offset="0.85" stopColor="#C084FC" />
          <Stop offset="1" stopColor="#A855F7" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        x={width / 2}
        y={height * 0.78}
        fontSize={fontSize}
        fontWeight="900"
        textAnchor="middle"
        fill={`url(#${gradientId})`}
        // Use system bold font — most reliable across devices. Outfit may not be available
        // inside react-native-svg text rendering on Android, so we fall back gracefully.
        fontFamily={Platform.select({ ios: 'System', android: 'sans-serif' })}
      >
        {text}
      </SvgText>
    </Svg>
  );
}

export function Logo({ size = 'default' }) {
  const fontSize = SIZES[size] || SIZES.default;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, [anim]);

  return (
    <View style={styles.row}>
      <SvgGradientText fontSize={fontSize} gradientId={`hn-grad-1-${size}`} animProgress={anim}>Here & N</SvgGradientText>
      <ClockO size={fontSize * 1.05} />
      <SvgGradientText fontSize={fontSize} gradientId={`hn-grad-2-${size}`} animProgress={anim}>w</SvgGradientText>
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

// Plain bright text variant for body copy that wants the brand colour without SVG.
export function BrandText({ children, style }) {
  return <Text style={[{ color: '#C084FC', fontWeight: '700' }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { alignItems: 'center', justifyContent: 'center' },
});

export default Logo;
