import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import HeroGradient from '../../components/HeroGradient';
import { Logo, LogoIcon } from '../../components/Logo';
import { GlassCard, FormInput, SolidButton, GhostButton } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../utils/theme';
import { authAPI } from '../../utils/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState('request'); // 'request' | 'reset'

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      setSent(true);
      if (response.data?.reset_token) setResetToken(response.data.reset_token);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      Alert.alert('Success', 'Password updated! You can now log in.');
      navigation.navigate('Login');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HeroGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ padding: 16 }}>
          <GhostButton icon={ArrowLeft} label="Back to Login" onPress={() => navigation.navigate('Login')} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.logoRow}>
              <LogoIcon size={40} />
              <View style={{ width: 12 }} />
              <Logo size="default" />
            </View>

            <GlassCard>
              {!sent ? (
                <>
                  <View style={[styles.iconWrap, { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
                    <Mail size={28} color={COLORS.primaryLight} />
                  </View>
                  <Text style={styles.title}>Forgot password?</Text>
                  <Text style={styles.subtitle}>Enter your email and we'll send you reset instructions.</Text>

                  <View style={{ gap: 24 }}>
                    <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
                    <SolidButton label={loading ? 'Sending...' : 'Send Reset Link'} loading={loading} onPress={handleRequestReset} color={COLORS.primary} />
                  </View>
                </>
              ) : step === 'request' ? (
                <>
                  <View style={[styles.iconWrap, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                    <CheckCircle size={28} color={COLORS.emeraldLight} />
                  </View>
                  <Text style={styles.title}>Check your email</Text>
                  <Text style={styles.subtitle}>If this email exists, you'll receive a reset link shortly.</Text>

                  {resetToken ? (
                    <View style={styles.devBox}>
                      <Text style={styles.devLabel}>Dev Mode: Reset Token</Text>
                      <Text style={styles.devToken}>{resetToken}</Text>
                      <SolidButton label="Reset Password Now" onPress={() => setStep('reset')} color={COLORS.amber} style={{ marginTop: 12 }} />
                    </View>
                  ) : null}

                  <Pressable onPress={() => navigation.navigate('Login')} style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={styles.backLabel}>Back to Login</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Set New Password</Text>
                  <Text style={styles.subtitle}>Enter your new password below.</Text>

                  <View style={{ gap: 24 }}>
                    <FormInput label="Reset Token" value={resetToken} onChangeText={setResetToken} />
                    <FormInput label="New Password" value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" secureTextEntry helper="At least 6 characters" />
                    <SolidButton label={loading ? 'Updating...' : 'Update Password'} loading={loading} onPress={handleResetPassword} color={COLORS.emerald} />
                  </View>
                </>
              )}

              <View style={styles.footRow}>
                <Text style={styles.footText}>Remember your password? </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkAccent}>Sign in</Text>
                </Pressable>
              </View>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </HeroGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 80, justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', fontFamily: FONTS.headingBold, marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 28, fontFamily: FONTS.body },
  devBox: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', borderWidth: 1, borderRadius: RADIUS.lg, padding: 16, marginVertical: 16 },
  devLabel: { color: COLORS.amber, fontSize: 13, fontFamily: FONTS.bodyMedium, marginBottom: 6 },
  devToken: { color: COLORS.textLabel, fontSize: 11, fontFamily: 'monospace' },
  backBtn: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.lg, marginTop: 12 },
  backLabel: { color: COLORS.textSecondary, fontFamily: FONTS.bodyMedium },
  footRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footText: { color: COLORS.textSecondary, fontFamily: FONTS.body },
  linkAccent: { color: COLORS.primaryLight, fontFamily: FONTS.bodySemibold },
});
