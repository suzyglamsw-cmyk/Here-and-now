import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ArrowLeft, Eye, EyeOff, Users, Heart, Sparkles, MapPin, Camera } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS } from '../utils/theme';

// Cartoon-ish silhouette in lieu of /avatarA.png and /avatarB.png from web build.
function CartoonAvatar({ variant = 'A', blur = 'heavy' }) {
  // We render a stylised face inside a square — then overlay a translucent overlay to simulate blur level
  const blurOpacities = { heavy: 0.85, medium: 0.45, clear: 0 };
  const overlayOpacity = blurOpacities[blur];
  const skin = variant === 'A' ? '#F4C99A' : '#D69E7C';
  const hair = variant === 'A' ? '#F2D27A' : '#3F2A1F';
  const bg = variant === 'A' ? '#F7CFE0' : '#A0BEDC';

  return (
    <View style={styles.avatarBox}>
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Rect x="0" y="0" width="64" height="64" fill={bg} />
        {/* hair back */}
        <Ellipse cx="32" cy="28" rx="18" ry="18" fill={hair} />
        {/* face */}
        <Circle cx="32" cy="30" r="13" fill={skin} />
        {/* eyes */}
        <Circle cx="27" cy="30" r="1.5" fill="#222" />
        <Circle cx="37" cy="30" r="1.5" fill="#222" />
        {/* mouth */}
        <Ellipse cx="32" cy="36" rx="3" ry="1" fill="#A23B5C" />
        {/* shoulders */}
        <Ellipse cx="32" cy="60" rx="22" ry="14" fill={variant === 'A' ? '#7BA3D9' : '#5C4E8C'} />
      </Svg>
      {/* simulated blur overlay */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15,23,42,0.0)' }]} />
      {overlayOpacity > 0 && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15,23,42,0.0)' }]}>
          <Svg width="100%" height="100%" viewBox="0 0 64 64">
            <Defs>
              <SvgLinearGradient id="blur" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#0F172A" stopOpacity={overlayOpacity * 0.6} />
                <Stop offset="1" stopColor="#1E293B" stopOpacity={overlayOpacity} />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="64" height="64" fill="url(#blur)" />
          </Svg>
        </View>
      )}
    </View>
  );
}

function SilhouetteVisual() {
  return (
    <View style={[styles.avatarBox, { backgroundColor: '#1E293B' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Defs>
          <SvgLinearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#334155" />
            <Stop offset="1" stopColor="#020617" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="64" height="64" fill="url(#sg)" />
        <Circle cx="32" cy="22" r="12" fill="#475569" />
        <Ellipse cx="32" cy="52" rx="18" ry="14" fill="#475569" />
      </Svg>
    </View>
  );
}

// GradientText: solid purple approximation of web's gradient-to-r text
function GradientText({ children, style }) {
  return <Text style={[style, { color: '#C77DFF' }]}>{children}</Text>;
}

function StepCard({ number, title, description, icon: Icon, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.numBadge}>
          <GradientText style={styles.numText}>{String(number)}</GradientText>
        </View>
        <View style={{ flex: 1 }}>
          <GradientText style={styles.cardTitle}>{title}</GradientText>
        </View>
        {Icon && <Icon size={16} color={COLORS.textSecondary} />}
      </View>
      <View style={styles.cardVisuals}>{children}</View>
      <Text style={styles.cardDesc}>{description}</Text>
    </View>
  );
}

function Labeled({ label, children }) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {children}
      {label && <Text style={styles.tinyLabel}>{label}</Text>}
    </View>
  );
}

export default function HowItWorksTutorialScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <ArrowLeft size={20} color={COLORS.textSecondary} />
          </Pressable>
          <GradientText style={styles.headerTitle}>Quick Steps: How It Works</GradientText>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <StepCard number={1} title="STEP 1 — Strangers" icon={Users}
            description="You start as strangers. Photos are heavily blurred for protection.">
            <Labeled label="You"><CartoonAvatar variant="A" blur="heavy" /></Labeled>
            <Labeled label="Them"><CartoonAvatar variant="B" blur="heavy" /></Labeled>
          </StepCard>

          <StepCard number={2} title="STEP 2 — Someone shows interest" icon={Eye}
            description="If you send or receive a Glance, Icebreaker, or Chat Request, photos stay heavily blurred until you both respond.">
            <Labeled label="You"><CartoonAvatar variant="A" blur="heavy" /></Labeled>
            <View style={styles.middleCol}><Heart size={20} color={COLORS.pinkLight} /></View>
            <Labeled label="Them"><CartoonAvatar variant="B" blur="heavy" /></Labeled>
          </StepCard>

          <StepCard number={3} title="STEP 3 — Mutual connection" icon={Heart}
            description="You're connected when there's mutual interest — returned glances, accepted icebreakers, or accepted chat requests. Photos soften to a medium blur.">
            <Labeled label="You"><CartoonAvatar variant="A" blur="medium" /></Labeled>
            <View style={styles.middleCol}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Heart size={16} color={COLORS.pinkLight} />
                <Heart size={16} color={COLORS.pinkLight} />
              </View>
            </View>
            <Labeled label="Them"><CartoonAvatar variant="B" blur="medium" /></Labeled>
          </StepCard>

          <StepCard number={4} title="STEP 4 — Reveal choice" icon={EyeOff}
            description="You can both choose to reveal your photos. Nothing changes until you've both chosen to reveal.">
            <Labeled label="You (revealed)"><CartoonAvatar variant="A" blur="medium" /></Labeled>
            <View style={styles.middleCol}><Text style={styles.tinyLabel}>waiting...</Text></View>
            <Labeled label="Them (not yet)"><CartoonAvatar variant="B" blur="medium" /></Labeled>
          </StepCard>

          <StepCard number={5} title="STEP 5 — Mutual reveal" icon={Sparkles}
            description="When you both reveal, you see each other clearly everywhere in the app.">
            <Labeled label="You"><CartoonAvatar variant="A" blur="clear" /></Labeled>
            <View style={styles.middleCol}><Sparkles size={22} color="#FBBF24" /></View>
            <Labeled label="Them"><CartoonAvatar variant="B" blur="clear" /></Labeled>
          </StepCard>

          <StepCard number={6} title="STEP 6 — Hide photo in venues" icon={MapPin}
            description="If you hide your photo in venues, others will see a generic silhouette there. But anyone you've mutually revealed with will still see your clear photo in your full profile.">
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={styles.tinyLabel}>In Venues</Text>
              <SilhouetteVisual />
              <Text style={styles.tinyLabel}>You (hidden)</Text>
            </View>
            <View style={styles.divider} />
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={styles.tinyLabel}>Full Profile</Text>
              <CartoonAvatar variant="A" blur="clear" />
              <Text style={styles.tinyLabel}>(mutual reveal)</Text>
            </View>
          </StepCard>

          <StepCard number={7} title="STEP 7 — Keep it real" icon={Camera}
            description="Here&Now works best with real, recent photos — particularly in venues, where you may want to meet the person behind the photos while they're in the same place as you.">
            <CartoonAvatar variant="A" blur="clear" />
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Camera size={24} color={COLORS.primaryLight} />
              <Text style={styles.tinyLabel}>Real & recent</Text>
            </View>
            <CartoonAvatar variant="B" blur="clear" />
          </StepCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(2,6,23,0.9)' },
  backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONTS.headingBold },
  scroll: { padding: 16, paddingBottom: 80, gap: 16 },
  card: { backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: RADIUS['2xl'], padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  numBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 13, fontFamily: FONTS.bodyBold },
  cardTitle: { fontSize: 15, fontFamily: FONTS.bodySemibold },
  cardVisuals: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 },
  cardDesc: { color: '#fff', fontSize: 13, lineHeight: 19, fontFamily: FONTS.body },
  avatarBox: { width: 64, height: 64, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#1E293B' },
  middleCol: { alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1, height: 64, backgroundColor: 'rgba(255,255,255,0.1)' },
  tinyLabel: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.bodyMedium },
});
