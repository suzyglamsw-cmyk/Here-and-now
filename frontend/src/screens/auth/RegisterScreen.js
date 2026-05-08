import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, User as UserIcon, Heart, Check, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import HeroGradient from '../../components/HeroGradient';
import { Logo, LogoIcon } from '../../components/Logo';
import { GlassCard, FormInput, GradientButton, GhostButton } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

const BLOCKED = [
  /\d{5,}/, /@/, /\.com|\.net|\.org|\.io/i, /http|www\./i,
  /instagram|snapchat|tiktok|twitter|facebook|whatsapp|telegram/i,
];
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

const validateName = (name) => {
  if (!name || name.trim().length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (name.trim().length > 20) return { valid: false, error: 'Name must be 20 characters or less' };
  for (const p of BLOCKED) if (p.test(name)) return { valid: false, error: 'Name contains blocked content. Please use your first name only.' };
  return { valid: true, error: null };
};

const validateDob = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { valid: false, msg: 'Use format YYYY-MM-DD' };
  const dob = new Date(s);
  if (isNaN(dob.getTime())) return { valid: false, msg: 'Invalid date' };
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  if (age < 18) return { valid: false, msg: 'You must be 18 or older' };
  return { valid: true, msg: '' };
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [step, setStep] = useState('age-gate'); // 'age-gate' | 'register' | 'gender'
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Default the date picker to 25 years ago so adults see a useful starting point.
  const defaultDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 25); return d; })();
  const maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })();
  const [dobDate, setDobDate] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', display_name: '', date_of_birth: '', show_as: '' });

  const nameValidation = form.display_name ? validateName(form.display_name) : { valid: true, error: null };

  const handleAgeConfirm = () => {
    if (!ageConfirmed) {
      Alert.alert('Confirm age', 'You must confirm you are 18 or older to continue');
      return;
    }
    setStep('register');
  };

  const handleSubmitForm = () => {
    const nv = validateName(form.display_name);
    if (!nv.valid) return Alert.alert('Invalid name', nv.error);
    if (!PASSWORD_REGEX.test(form.password)) return Alert.alert('Weak password', 'Password must be at least 8 characters with letters and numbers');
    if (form.password !== confirmPassword) return Alert.alert('Mismatch', 'Passwords do not match');
    const dv = validateDob(form.date_of_birth);
    if (!dv.valid) return Alert.alert('Date of birth', dv.msg);
    setStep('gender');
  };

  const handleSubmitGender = async () => {
    if (!form.show_as) return Alert.alert('Pick one', "Please select how you'd like to appear");
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (!res.success) Alert.alert('Registration failed', res.error || 'Try again');
  };

  const onBack = () => {
    if (step === 'gender') setStep('register');
    else if (step === 'register') setStep('age-gate');
    else navigation.canGoBack() ? navigation.goBack() : navigation.replace('Landing');
  };

  return (
    <HeroGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ padding: 16 }}>
          <GhostButton icon={ArrowLeft} label="Back" onPress={onBack} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.logoRow}>
              <LogoIcon size={40} />
              <View style={{ width: 12 }} />
              <Logo size="default" />
            </View>

            {step === 'age-gate' && (
              <GlassCard>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(201,167,255,0.2)' }]}>
                  <Shield size={32} color="#C9A7FF" />
                </View>
                <Text style={styles.title}>Age Verification</Text>

                <Text style={[styles.bodyText, { marginBottom: 24 }]}>
                  Here & Now is for adults 18+.
                  {'\n'}
                  By continuing, you're confirming you're over 18 and happy with our community guidelines.
                </Text>

                <Pressable onPress={() => setAgeConfirmed(!ageConfirmed)} style={styles.checkboxRow}>
                  <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                    {ageConfirmed && <Check size={16} color="#0F172A" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I confirm I am <Text style={{ fontFamily: FONTS.bodyBold }}>18 or older</Text> and agree to the community guidelines.
                  </Text>
                </Pressable>

                <GradientButton label="Continue" onPress={handleAgeConfirm} disabled={!ageConfirmed} />

                <Text style={styles.note}>If you're not 18 yet, you'll need to wait a little longer.</Text>
              </GlassCard>
            )}

            {step === 'register' && (
              <GlassCard>
                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.subtitle}>Join the community</Text>

                <View style={{ gap: 24 }}>
                  <FormInput
                    label="First Name"
                    value={form.display_name}
                    onChangeText={(v) => setForm({ ...form, display_name: v })}
                    placeholder="Your first name"
                    autoCapitalize="words"
                    maxLength={20}
                    error={form.display_name && !nameValidation.valid ? nameValidation.error : null}
                    helper="Use your real first name. This will be visible to others."
                  />
                  <FormInput
                    label="Email"
                    value={form.email}
                    onChangeText={(v) => setForm({ ...form, email: v })}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                  />
                  <FormInput
                    label="Create password"
                    value={form.password}
                    onChangeText={(v) => setForm({ ...form, password: v })}
                    placeholder="••••••••"
                    secureTextEntry
                    helper="At least 8 characters, with letters and numbers."
                  />
                  <FormInput
                    label="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    secureTextEntry
                    helper="Just to make sure there are no typos."
                    error={confirmPassword && form.password !== confirmPassword ? "These don't match yet." : null}
                  />
                  {/* Date of Birth — native date picker (iOS spinner / Android dialog) */}
                  <View style={{ gap: 8 }}>
                    <Text style={styles.dobLabel}>Date of Birth</Text>
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={({ pressed }) => [styles.dobInput, pressed && { backgroundColor: COLORS.inputBgFocus }]}
                    >
                      <Calendar size={18} color={COLORS.textSecondary} />
                      <Text style={[styles.dobValue, !form.date_of_birth && { color: COLORS.textPlaceholder }]}>
                        {form.date_of_birth || 'Select your date of birth'}
                      </Text>
                    </Pressable>
                    <Text style={styles.dobHelper}>You must be 18 or older. Your age will be shown, but not your DOB.</Text>
                  </View>

                  {showDatePicker && (
                    Platform.OS === 'ios' ? (
                      <Modal transparent animationType="slide" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
                          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
                            <View style={styles.modalHeader}>
                              <Pressable onPress={() => setShowDatePicker(false)} hitSlop={10}>
                                <Text style={styles.modalCancel}>Cancel</Text>
                              </Pressable>
                              <Text style={styles.modalTitle}>Date of Birth</Text>
                              <Pressable
                                onPress={() => {
                                  const picked = dobDate || defaultDob;
                                  const iso = picked.toISOString().split('T')[0];
                                  setForm({ ...form, date_of_birth: iso });
                                  setShowDatePicker(false);
                                }}
                                hitSlop={10}
                              >
                                <Text style={styles.modalDone}>Done</Text>
                              </Pressable>
                            </View>
                            <DateTimePicker
                              value={dobDate || defaultDob}
                              mode="date"
                              display="spinner"
                              maximumDate={maxDob}
                              minimumDate={new Date(1925, 0, 1)}
                              themeVariant="dark"
                              onChange={(event, selected) => { if (selected) setDobDate(selected); }}
                              style={{ backgroundColor: COLORS.backgroundLight }}
                            />
                          </Pressable>
                        </Pressable>
                      </Modal>
                    ) : (
                      <DateTimePicker
                        value={dobDate || defaultDob}
                        mode="date"
                        display="default"
                        maximumDate={maxDob}
                        minimumDate={new Date(1925, 0, 1)}
                        onChange={(event, selected) => {
                          setShowDatePicker(false);
                          if (event.type === 'set' && selected) {
                            setDobDate(selected);
                            setForm({ ...form, date_of_birth: selected.toISOString().split('T')[0] });
                          }
                        }}
                      />
                    )
                  )}

                  <GradientButton label="Continue" onPress={handleSubmitForm} disabled={!nameValidation.valid} />
                </View>

                <View style={styles.footRow}>
                  <Text style={styles.footText}>Already have an account? </Text>
                  <Pressable onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkAccent}>Sign in</Text>
                  </Pressable>
                </View>
              </GlassCard>
            )}

            {step === 'gender' && (
              <GlassCard>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(168,85,247,0.2)' }]}>
                  <UserIcon size={32} color={COLORS.purpleLight} />
                </View>
                <Text style={styles.title}>How would you like to appear?</Text>
                <Text style={styles.subtitle}>This helps us show you to the right people</Text>

                <GenderCards selected={form.show_as} onSelect={(v) => setForm({ ...form, show_as: v })} />

                <View style={styles.inclusivityBox}>
                  <Heart size={18} color={COLORS.purpleLight} style={{ marginTop: 2 }} />
                  <Text style={styles.inclusivityText}>
                    We recognise that gender is personal and nuanced. This selection helps connect you with people looking for someone like you. Additional options are available in your profile settings.
                  </Text>
                </View>

                <GradientButton label={loading ? 'Creating account...' : 'Create Account'} loading={loading} onPress={handleSubmitGender} disabled={!form.show_as} />
              </GlassCard>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </HeroGradient>
  );
}

export function GenderCards({ selected, onSelect }) {
  return (
    <View style={styles.cardGrid}>
      <Pressable onPress={() => onSelect('male')} style={[styles.genderCard, selected === 'male' && { borderColor: '#60A5FA', backgroundColor: 'rgba(59,130,246,0.2)' }]}>
        <View style={[styles.genderIcon, selected === 'male' ? { backgroundColor: 'rgba(59,130,246,0.3)' } : { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={[styles.genderLetter, { color: selected === 'male' ? '#93C5FD' : COLORS.textSecondary }]}>M</Text>
        </View>
        <Text style={[styles.genderLabel, { color: selected === 'male' ? '#BFDBFE' : COLORS.textLabel }]}>Male</Text>
        {selected === 'male' && (
          <View style={[styles.tickBadge, { backgroundColor: '#3B82F6' }]}>
            <Check size={14} color="#fff" />
          </View>
        )}
      </Pressable>

      <Pressable onPress={() => onSelect('female')} style={[styles.genderCard, selected === 'female' && { borderColor: '#F472B6', backgroundColor: 'rgba(236,72,153,0.2)' }]}>
        <View style={[styles.genderIcon, selected === 'female' ? { backgroundColor: 'rgba(236,72,153,0.3)' } : { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={[styles.genderLetter, { color: selected === 'female' ? '#F9A8D4' : COLORS.textSecondary }]}>F</Text>
        </View>
        <Text style={[styles.genderLabel, { color: selected === 'female' ? '#FBCFE8' : COLORS.textLabel }]}>Female</Text>
        {selected === 'female' && (
          <View style={[styles.tickBadge, { backgroundColor: '#EC4899' }]}>
            <Check size={14} color="#fff" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 80, justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', fontFamily: FONTS.headingBold, marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 28, fontFamily: FONTS.body },
  bodyText: { color: '#fff', textAlign: 'center', lineHeight: 22, fontFamily: FONTS.body },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#C9A7FF', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#C9A7FF', borderColor: '#C9A7FF' },
  checkboxLabel: { color: '#fff', flex: 1, fontSize: 14, lineHeight: 20, fontFamily: FONTS.body },
  note: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 24, fontFamily: FONTS.body },
  cardGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  genderCard: { flex: 1, paddingVertical: 24, paddingHorizontal: 16, borderRadius: RADIUS['2xl'], borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', position: 'relative' },
  genderIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  genderLetter: { fontSize: 22, fontFamily: FONTS.bodyBold },
  genderLabel: { fontFamily: FONTS.bodyMedium, fontSize: 15 },
  tickBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inclusivityBox: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: RADIUS.lg, backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', marginBottom: 24 },
  inclusivityText: { color: 'rgba(216,180,254,0.8)', flex: 1, fontSize: 13, lineHeight: 19, fontFamily: FONTS.body },
  footRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footText: { color: COLORS.textSecondary, fontFamily: FONTS.body },
  linkAccent: { color: COLORS.primaryLight, fontFamily: FONTS.bodySemibold },
  // DOB picker styles
  dobLabel: { color: COLORS.textLabel, fontSize: 14, fontFamily: FONTS.bodyMedium },
  dobInput: { height: 48, backgroundColor: COLORS.inputBg, borderRadius: RADIUS.lg, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dobValue: { color: COLORS.text, fontSize: 16, fontFamily: FONTS.body },
  dobHelper: { fontSize: 12, color: COLORS.textPlaceholder, fontFamily: FONTS.body },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 16, fontFamily: FONTS.bodySemibold },
  modalCancel: { color: COLORS.textSecondary, fontFamily: FONTS.bodyMedium, fontSize: 15 },
  modalDone: { color: COLORS.primaryLight, fontFamily: FONTS.bodySemibold, fontSize: 15 },
});
