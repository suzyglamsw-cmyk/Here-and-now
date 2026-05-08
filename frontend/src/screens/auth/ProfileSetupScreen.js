import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroGradient from '../../components/HeroGradient';
import { FormInput, FormTextarea, GradientButton, WhiteButton, GhostButton } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';

const INTERESTS = ['Music', 'Fitness', 'Food', 'Travel', 'Art', 'Outdoors', 'Gaming', 'Nightlife', 'Coffee', 'Reading'];
const GENDERS = ['Woman', 'Man', 'Non-binary', 'Trans woman', 'Trans man', 'Prefer not to say', 'Other'];
const ORIENTATIONS = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Queer', 'Asexual', 'Prefer not to say'];
const RELATIONSHIPS = ['Single', 'Seeing someone', 'In a relationship', "It's complicated", 'Prefer not to say'];
const SEEKING = ['Friends only', 'Dating', 'Both', 'Prefer not to say'];

// Bottom-sheet style picker
function Picker({ label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(!open)} style={styles.pickerWrap}>
        <Text style={[styles.pickerValue, !value && { color: COLORS.textPlaceholder }]}>
          {value || 'Select'}
        </Text>
      </Pressable>
      {open && (
        <View style={styles.optionsBox}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => { onSelect(opt); setOpen(false); }}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
            >
              <Text style={[styles.optionLabel, value === opt && { color: COLORS.primaryLight }]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ProfileSetupScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    age: user?.age ? String(user.age) : '',
    gender: user?.gender || '',
    orientation: user?.orientation || '',
    relationship_status: user?.relationship_status || '',
    seeking: user?.seeking || '',
  });

  const toggleInterest = (i) => {
    setForm((p) => ({
      ...p,
      interests: p.interests.includes(i) ? p.interests.filter((x) => x !== i) : [...p.interests, i].slice(0, 5),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = { ...form, age: form.age ? parseInt(form.age, 10) : undefined };
      const response = await authAPI.updateProfile(payload);
      updateUser({ ...response.data, profile_complete: true });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = () => (step === 1 ? form.display_name.trim().length > 0 : true);

  return (
    <HeroGradient>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={[styles.progressBar, s <= step ? { backgroundColor: COLORS.primary } : { backgroundColor: '#334155' }]} />
            ))}
          </View>
          <Text style={styles.progressLabel}>Step {step} of 3</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {step === 1 && (
              <View style={{ gap: 32 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.title}>Let's set up your profile</Text>
                  <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
                </View>
                <FormInput
                  label="Display Name"
                  value={form.display_name}
                  onChangeText={(v) => setForm({ ...form, display_name: v })}
                  placeholder="Your name or nickname"
                  autoCapitalize="words"
                />
                <FormTextarea
                  label="Short Bio (optional)"
                  value={form.bio}
                  onChangeText={(v) => setForm({ ...form, bio: v })}
                  placeholder="A few words about yourself..."
                  maxLength={150}
                  rows={4}
                />
                <Text style={styles.note}>You can add photos and more details in your profile settings later.</Text>
              </View>
            )}

            {step === 2 && (
              <View style={{ gap: 24 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.title}>About You</Text>
                  <Text style={styles.subtitle}>Help others get to know you (all optional)</Text>
                </View>
                <FormInput label="Age" value={form.age} onChangeText={(v) => setForm({ ...form, age: v.replace(/[^0-9]/g, '') })} placeholder="Your age" keyboardType="number-pad" />
                <Picker label="Gender (optional)" value={form.gender} options={GENDERS} onSelect={(v) => setForm({ ...form, gender: v })} />
                <Picker label="Orientation (optional)" value={form.orientation} options={ORIENTATIONS} onSelect={(v) => setForm({ ...form, orientation: v })} />
                <Picker label="Relationship Status (optional)" value={form.relationship_status} options={RELATIONSHIPS} onSelect={(v) => setForm({ ...form, relationship_status: v })} />
                <Picker label="Seeking (optional)" value={form.seeking} options={SEEKING} onSelect={(v) => setForm({ ...form, seeking: v })} />
              </View>
            )}

            {step === 3 && (
              <View style={{ gap: 32 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.title}>Your Interests</Text>
                  <Text style={styles.subtitle}>Select up to 5 interests</Text>
                </View>
                <View style={styles.chipWrap}>
                  {INTERESTS.map((i) => {
                    const sel = form.interests.includes(i);
                    return (
                      <Pressable key={i} onPress={() => toggleInterest(i)} style={[styles.chip, sel && styles.chipActive]}>
                        <Text style={[styles.chipLabel, sel && styles.chipLabelActive]}>{i}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.note, { textAlign: 'center' }]}>{form.interests.length}/5 selected</Text>
              </View>
            )}

            <View style={styles.navRow}>
              {step > 1 && (
                <GhostButton label="Back" onPress={() => setStep(step - 1)} style={styles.backNav} textStyle={{ color: COLORS.textLabel }} />
              )}
              {step < 3 ? (
                <WhiteButton label="Continue" onPress={() => setStep(step + 1)} disabled={!canContinue()} style={{ flex: 1 }} />
              ) : (
                <GradientButton label={loading ? 'Saving...' : 'Complete Setup'} loading={loading} onPress={handleSubmit} style={{ flex: 1 }} />
              )}
            </View>

            {step === 3 && (
              <Pressable onPress={handleSubmit} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={styles.skip}>Skip for now</Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </HeroGradient>
  );
}

const styles = StyleSheet.create({
  progressWrap: { padding: 16 },
  progressRow: { flexDirection: 'row', gap: 8, alignSelf: 'center', maxWidth: 400, width: '100%' },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressLabel: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 8, fontFamily: FONTS.body },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, alignItems: 'stretch' },
  title: { fontSize: 24, color: '#fff', fontFamily: FONTS.headingBold, marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, fontFamily: FONTS.body },
  label: { color: COLORS.textLabel, fontSize: 14, fontFamily: FONTS.bodyMedium },
  note: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.body, textAlign: 'center' },
  pickerWrap: { height: 48, backgroundColor: COLORS.inputBg, borderRadius: RADIUS.lg, paddingHorizontal: 16, justifyContent: 'center' },
  pickerValue: { color: COLORS.text, fontSize: 16, fontFamily: FONTS.body },
  optionsBox: { backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginTop: 4, paddingVertical: 4 },
  option: { paddingHorizontal: 16, paddingVertical: 12 },
  optionLabel: { color: COLORS.text, fontFamily: FONTS.body, fontSize: 15 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.05)' },
  chipActive: { backgroundColor: COLORS.primary },
  chipLabel: { color: COLORS.textLabel, fontFamily: FONTS.bodyMedium, fontSize: 14 },
  chipLabelActive: { color: '#fff' },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  backNav: { flex: 1, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  skip: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.body },
});
