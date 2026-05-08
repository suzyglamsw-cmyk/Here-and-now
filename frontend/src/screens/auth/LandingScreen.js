import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, Snowflake, MessageSquare, Sparkles, EyeOff, Users, Clock } from 'lucide-react-native';
import HeroGradient from '../../components/HeroGradient';
import { Logo, LogoIcon } from '../../components/Logo';
import { WhiteButton, GhostButton } from '../../components/ui';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../../utils/theme';

const FEATURES = [
  { icon: Eye, title: 'Glance', description: "Let them know they've caught your attention." },
  { icon: Snowflake, title: 'Icebreakers', description: 'A short gesture to get the ball rolling.' },
  { icon: MessageSquare, title: 'Chat Request', description: 'Dive straight in with a chat request.' },
  { icon: Sparkles, title: 'Reveal', description: 'Accepted glances, icebreakers, or chat requests open messaging and begin the reveal process. Profiles start with a soft blur, and you can mutually choose to share clear photos as things progress.' },
  { icon: EyeOff, title: 'Visibility', description: "You choose when you're visible — at venues, nearby, or not at all." },
  { icon: Users, title: 'Friends', description: 'Keep the good ones close with a simple friends list.' },
];

export default function LandingScreen({ navigation }) {
  return (
    <HeroGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Background glow circles */}
          <View pointerEvents="none" style={[styles.glow, styles.glowIndigo]} />
          <View pointerEvents="none" style={[styles.glow, styles.glowPink]} />

          {/* Logo */}
          <View style={styles.logoRow}>
            <LogoIcon size={48} />
            <View style={{ width: 12 }} />
            <Logo size="large" />
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroLine1}>Two fun ways to meet people — make new friends, date, or a bit of both.</Text>
            <Text style={styles.heroLine2}>
              Live location check-in at venues to see who's there{' '}
              <Text style={{ color: COLORS.primaryLight }}>(here now)</Text>, or see who's nearby and ready to connect wherever you are{' '}
              <Text style={{ color: COLORS.pinkLight }}>(not here)</Text>.
            </Text>

            <View style={styles.ctaRow}>
              <WhiteButton label="Get Started" onPress={() => navigation.navigate('Register')} style={styles.ctaBtn} />
              <Pressable onPress={() => navigation.navigate('Login')} style={({ pressed }) => [styles.ghostCta, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={styles.ghostCtaLabel}>I have an account</Text>
              </Pressable>
            </View>
          </View>

          {/* How it works */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <Text style={styles.sectionSubtitle}>Simple, spontaneous, safe.</Text>
          </View>

          <View style={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <LinearGradient
                    colors={['rgba(99,102,241,0.2)', 'rgba(236,72,153,0.2)']}
                    style={styles.featureIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <f.icon size={20} color={COLORS.primaryLight} />
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Additional info */}
          <View style={{ marginTop: 24, gap: 8, paddingHorizontal: 8 }}>
            <Text style={styles.infoLine}>All profiles begin with a heavy blur, which softens once a mutual connection is made.</Text>
            <Text style={styles.infoLine}>Not so outgoing? Not sure yet? Just testing the waters? We've got you.</Text>
            <Text style={styles.infoLine}>In live venues, you can still be open to connect — with the option to show no picture until you're ready.</Text>
          </View>

          {/* CTA */}
          <View style={styles.ctaSection}>
            <View style={styles.ctaTitleRow}>
              <Text style={styles.ctaTitle}>What are you waiting for? The time is now </Text>
              <Clock size={26} color={COLORS.primaryLight} />
            </View>
            <Pressable onPress={() => navigation.navigate('Register')} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              <LinearGradient colors={[COLORS.primary, COLORS.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.joinBtn, SHADOWS.glowIndigo]}>
                <Text style={styles.joinBtnLabel}>Join Here & Now</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LogoIcon size={24} />
              <Text style={styles.footerName}>Here & Now</Text>
            </View>
            <Text style={styles.footerNote}>Adults 18+ only. Connect responsibly.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </HeroGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  glow: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.4 },
  glowIndigo: { top: 80, left: -80, backgroundColor: 'rgba(99,102,241,0.15)' },
  glowPink: { bottom: 200, right: -80, backgroundColor: 'rgba(236,72,153,0.12)' },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 32 },
  hero: { alignItems: 'center', gap: 16, paddingHorizontal: 8 },
  heroLine1: { color: COLORS.textLabel, fontSize: 18, lineHeight: 26, textAlign: 'center', fontFamily: FONTS.body },
  heroLine2: { color: COLORS.textSecondary, fontSize: 16, lineHeight: 24, textAlign: 'center', fontFamily: FONTS.body },
  ctaRow: { flexDirection: 'column', gap: 12, marginTop: 24, width: '100%' },
  ctaBtn: { height: 56, borderRadius: RADIUS.full, paddingHorizontal: 32 },
  ghostCta: { height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  ghostCtaLabel: { color: '#fff', fontFamily: FONTS.bodySemibold, fontSize: 17 },
  sectionHeader: { alignItems: 'center', marginTop: 40, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 26, fontFamily: FONTS.headingBold, marginBottom: 6 },
  sectionSubtitle: { color: COLORS.textSecondary, fontFamily: FONTS.body, fontSize: 14 },
  featureGrid: { gap: 8 },
  featureCard: { flexDirection: 'row', gap: 16, padding: 12, borderRadius: RADIUS['2xl'], backgroundColor: 'rgba(15,23,42,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  featureIconWrap: { width: 40, height: 40 },
  featureIcon: { width: 40, height: 40, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.bodySemibold, marginBottom: 2 },
  featureDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: FONTS.body },
  infoLine: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', fontFamily: FONTS.body },
  ctaSection: { alignItems: 'center', marginTop: 40, marginBottom: 32, paddingHorizontal: 16 },
  ctaTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ctaTitle: { color: '#fff', fontSize: 22, fontFamily: FONTS.headingBold, textAlign: 'center', lineHeight: 30 },
  joinBtn: { height: 56, paddingHorizontal: 32, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  joinBtnLabel: { color: '#fff', fontFamily: FONTS.bodyBold, fontSize: 17 },
  footer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 24, alignItems: 'center', gap: 8 },
  footerName: { color: COLORS.textSecondary, fontFamily: FONTS.bodyMedium, fontSize: 15 },
  footerNote: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.body },
});
