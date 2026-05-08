// Reusable UI primitives matching web's shadcn-style components but in RN.
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../utils/theme';

// Glass card — bg-slate-900/60 + border white/10
export function GlassCard({ children, style }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

// Standard input — h-12 bg-white/5 rounded-xl border-transparent focus:border-indigo
export function FormInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, maxLength, error, helper, ...rest }) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.eyeBtn} hitSlop={10}>
            {hidden ? <Eye size={20} color={COLORS.textSecondary} /> : <EyeOff size={20} color={COLORS.textSecondary} />}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

// Multi-line textarea
export function FormTextarea({ label, value, onChangeText, placeholder, maxLength, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused, { minHeight: 24 * rows + 24 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          maxLength={maxLength}
          multiline
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { minHeight: 24 * rows, paddingTop: 12 }]}
        />
      </View>
      {maxLength != null && (
        <Text style={[styles.helperText, { textAlign: 'right' }]}>{(value || '').length}/{maxLength}</Text>
      )}
    </View>
  );
}

// Primary button — gradient indigo→pink
export function GradientButton({ onPress, label, loading, disabled, style }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={isDisabled ? undefined : onPress} disabled={isDisabled} style={({ pressed }) => [{ opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      <LinearGradient colors={[COLORS.primary, COLORS.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.btnBase, SHADOWS.glowIndigo]}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnLabel}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

// White button (Login "Sign In")
export function WhiteButton({ onPress, label, loading, disabled, style }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={isDisabled ? undefined : onPress} disabled={isDisabled} style={({ pressed }) => [styles.btnBase, styles.whiteBtn, { opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={[styles.btnLabel, styles.whiteBtnLabel]}>{label}</Text>}
    </Pressable>
  );
}

// Solid color button (e.g. indigo for Send Reset Link)
export function SolidButton({ onPress, label, loading, disabled, color = COLORS.primary, style, textColor = '#fff' }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={isDisabled ? undefined : onPress} disabled={isDisabled} style={({ pressed }) => [styles.btnBase, { backgroundColor: color, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.btnLabel, { color: textColor }]}>{label}</Text>}
    </Pressable>
  );
}

// Ghost button (Back, etc.)
export function GhostButton({ onPress, label, icon: Icon, style, textStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }, style]}>
      {Icon && <Icon size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />}
      {label && <Text style={[styles.ghostLabel, textStyle]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS['2xl'],
    padding: 32,
  },
  label: { color: COLORS.textLabel, fontSize: 14, fontFamily: FONTS.bodyMedium },
  inputWrap: {
    height: 48,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.inputBgFocus },
  input: { flex: 1, color: COLORS.text, fontSize: 16, fontFamily: FONTS.body, padding: 0 },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 12, color: COLORS.amber, fontFamily: FONTS.body },
  helperText: { fontSize: 12, color: COLORS.textPlaceholder, fontFamily: FONTS.body },
  btnBase: { height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnLabel: { color: '#fff', fontSize: 16, fontFamily: FONTS.bodyBold, letterSpacing: 0.2 },
  whiteBtn: { backgroundColor: '#fff' },
  whiteBtnLabel: { color: '#0F172A' },
  ghostBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center' },
  ghostLabel: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.bodyMedium },
});
