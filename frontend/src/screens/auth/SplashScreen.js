import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroGradient from '../../components/HeroGradient';
import { Logo, LogoIcon } from '../../components/Logo';
import { COLORS, FONTS } from '../../utils/theme';

/**
 * SplashScreen — pixel-match of web Landing splash phase
 * Shows large logo + tagline for ~2.5s then navigates to Landing.
 */
export default function SplashScreen({ navigation }) {
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // fade in
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    // pulse the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    const t = setTimeout(() => {
      navigation.replace('Landing');
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <HeroGradient>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
            <Animated.View style={{ marginBottom: 24, transform: [{ scale: pulse }] }}>
              <LogoIcon size={64} />
            </Animated.View>
            <Logo size="large" />
            <Text style={styles.tagline}>Connect in the moment</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </HeroGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagline: { color: COLORS.textSecondary, fontSize: 18, marginTop: 16, fontFamily: FONTS.body },
});
