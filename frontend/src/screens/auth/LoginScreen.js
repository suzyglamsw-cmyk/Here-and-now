import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import HeroGradient from '../../components/HeroGradient';
import { Logo, LogoIcon } from '../../components/Logo';
import { GlassCard, FormInput, WhiteButton, GhostButton } from '../../components/ui';
import { COLORS, FONTS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordHelper =
    password && !PASSWORD_REGEX.test(password)
      ? "That doesn't look like the password format you set."
      : null;

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      Alert.alert('Sign in failed', res.error || 'Invalid credentials');
    }
  };

  return (
    <HeroGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ padding: 16 }}>
          <GhostButton
            icon={ArrowLeft}
            label="Back"
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Landing'))}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.logoRow}>
              <LogoIcon size={40} />
              <View style={{ width: 12 }} />
              <Logo size="default" />
            </View>

            <GlassCard>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              <View style={{ gap: 24 }}>
                <FormInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                />
                <FormInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  helper="Use the password you created when you joined."
                  error={passwordHelper}
                />

                <WhiteButton label={loading ? 'Signing in...' : 'Sign In'} loading={loading} onPress={handleSubmit} />
              </View>

              <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'center', marginTop: 16 }}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>

              <View style={styles.footRow}>
                <Text style={styles.footText}>Don't have an account? </Text>
                <Pressable onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.linkAccent}>Sign up</Text>
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
  title: { fontSize: 24, color: '#fff', textAlign: 'center', fontFamily: FONTS.headingBold, marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 28, fontFamily: FONTS.body },
  forgot: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.body },
  footRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footText: { color: COLORS.textSecondary, fontFamily: FONTS.body },
  linkAccent: { color: COLORS.primaryLight, fontFamily: FONTS.bodySemibold },
});
