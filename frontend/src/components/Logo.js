import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { COLORS, FONTS } from '../utils/theme';

// Pixel-match port of web Logo.js — "Here & N [clock-O] w" with animated purple→pink shimmer text.
// Web uses CSS background-clip:text + bg-position animation. We emulate with MaskedView + an
// animated LinearGradient slid behind the masked text.

const ClockO = ({ size = 20, color = '#C084FC' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" fill="none" />
    <Line x1="12" y1="12" x2="7.5" y2="15.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="12" y1="12" x2="12" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
);

const SIZES = {
  small: { text: 16, clock: 14, gradientWidth: 200 },
  default: { text: 20, clock: 18, gradientWidth: 240 },
  large: { text: 24, clock: 22, gradientWidth: 280 },
  hero: { text: 36, clock: 32, gradientWidth: 380 },
};

// 5-stop gradient mirrors web's `linear-gradient(90deg, #a855f7, #c084fc, #ec4899, #c084fc, #a855f7)`
const SHIMMER_COLORS = ['#a855f7', '#c084fc', '#ec4899', '#c084fc', '#a855f7'];

function ShimmerText({ children, fontSize, gradientWidth }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  // Web fallback: MaskedView's web build doesn't render gradient through alpha mask
  // reliably. Use solid purple-light text on web. Native (iOS/Android) gets the
  // proper animated gradient shimmer via MaskedView, matching the web app's CSS effect.
  const textStyle = {
    fontSize,
    fontFamily: FONTS.headingBold,
    letterSpacing: -0.5,
    color: Platform.OS === 'web' ? COLORS.purpleLight : '#000',
    backgroundColor: 'transparent',
  };

  if (Platform.OS === 'web') {
    return <Text style={textStyle}>{children}</Text>;
  }

  // Repeat the 5-stop palette so the visible window always sits over a colorful section.
  const repeatedColors = [...SHIMMER_COLORS, ...SHIMMER_COLORS, ...SHIMMER_COLORS];
  const wideGradientWidth = gradientWidth * 3;
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-gradientWidth, 0],
  });

  return (
    <MaskedView maskElement={<Text style={textStyle}>{children}</Text>}>
      <Animated.View style={{ width: wideGradientWidth, transform: [{ translateX }] }}>
        <LinearGradient
          colors={repeatedColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ height: fontSize * 1.4, width: wideGradientWidth }}
        />
      </Animated.View>
    </MaskedView>
  );
}

export function Logo({ size = 'default', showText = true }) {
  const s = SIZES[size];
  return (
    <View style={styles.row}>
      {showText && <ShimmerText fontSize={s.text} gradientWidth={s.gradientWidth}>Here & N</ShimmerText>}
      <ClockO size={s.clock} />
      {showText && <ShimmerText fontSize={s.text} gradientWidth={s.gradientWidth}>w</ShimmerText>}
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
