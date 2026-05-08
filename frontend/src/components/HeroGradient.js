import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';

// Pixel-match of web's .hero-gradient — radial indigo glow at top, pink hint bottom-right.
// RN doesn't support radial gradients natively, so we layer two LinearGradients to approximate.
export default function HeroGradient({ children, style }) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.18)', 'rgba(99, 102, 241, 0.05)', 'rgba(2, 6, 23, 0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(2, 6, 23, 0)', 'rgba(236, 72, 153, 0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});
