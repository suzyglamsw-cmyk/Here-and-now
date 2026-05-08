import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User as UserIcon, Heart } from 'lucide-react-native';
import HeroGradient from '../../components/HeroGradient';
import { Logo, LogoIcon } from '../../components/Logo';
import { GlassCard, GradientButton, GhostButton } from '../../components/ui';
import { GenderCards } from './RegisterScreen';
import { COLORS, FONTS, RADIUS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';

export default function OnboardingGenderScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [selected, setSelected] = useState(user?.show_as || '');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return Alert.alert('Pick one', "Please select how you'd like to appear");
    setLoading(true);
    try {
      const response = await authAPI.updateProfile({ show_as: selected });
      updateUser(response.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HeroGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ padding: 16 }}>
          <GhostButton icon={ArrowLeft} label="Back" onPress={() => (navigation.canGoBack() ? navigation.goBack() : null)} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}>
            <LogoIcon size={40} />
            <View style={{ width: 12 }} />
            <Logo size="default" />
          </View>

          <GlassCard>
            <View style={styles.iconWrap}>
              <UserIcon size={32} color={COLORS.purpleLight} />
            </View>

            <Text style={styles.title}>How would you like to appear?</Text>
            <Text style={styles.subtitle}>This helps us show you to the right people</Text>

            <GenderCards selected={selected} onSelect={setSelected} />

            <View style={styles.inclusivityBox}>
              <Heart size={18} color={COLORS.purpleLight} style={{ marginTop: 2 }} />
              <Text style={styles.inclusivityText}>
                We recognise that gender is personal and nuanced. This selection helps connect you with people looking for someone like you. Additional options are available in your profile settings.
              </Text>
            </View>

            <GradientButton label={loading ? 'Saving...' : 'Continue'} loading={loading} onPress={handleContinue} disabled={!selected} />
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </HeroGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 80, justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24, backgroundColor: 'rgba(168,85,247,0.2)' },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', fontFamily: FONTS.headingBold, marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 28, fontFamily: FONTS.body },
  inclusivityBox: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: RADIUS.lg, backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', marginBottom: 24 },
  inclusivityText: { color: 'rgba(216,180,254,0.8)', flex: 1, fontSize: 13, lineHeight: 19, fontFamily: FONTS.body },
});
