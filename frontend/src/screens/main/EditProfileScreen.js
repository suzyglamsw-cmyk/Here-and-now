/**
 * EditProfileScreen — direct React Native port of the web `ProfileTab.js`.
 *
 * Faithfully replicates the existing web edit-profile experience.
 * Sections kept (in order): Photos / Quick Controls (shy, hide-from-discovery,
 * hide-photo-in-venues) / Presence Note / About You / Lifestyle / Food Mood /
 * Gender & Identity (show_as, seeking, rainbow, open_to_all, intent) / Home Area.
 * Voice Intro section is intentionally REMOVED (web uses MediaRecorder which
 * is not supported in React Native).
 *
 * No new features. No invented sections. This is a port, not a redesign.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, Camera, Loader, Plus, X, Heart, Eye, EyeOff,
  User as UserIcon, MapPin, Home, ChevronDown, Users, Check,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import api, { authAPI, photosAPI, settingsAPI } from '../../utils/api';
import { API_URL } from '../../utils/constants';

// ---- Constants ported verbatim from web ProfileTab.js ----
const MAX_BIO_LENGTH = 500;
const MAX_PRESENCE_NOTE_LENGTH = 40;
const MIN_BIO_LENGTH = 10;

const INTENT_OPTIONS = [
  { value: '', label: 'Select your intent...' },
  { value: 'dating', label: 'Dating' },
  { value: 'friends', label: 'Friends' },
  { value: 'open_to_both', label: 'Open to both' },
];

const LIFESTYLE_VIBE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Party animal', label: 'Party animal' },
  { value: 'More laid-back', label: 'More laid-back' },
  { value: 'A mix of laid back and lively', label: 'A mix of laid back and lively' },
  { value: 'Quiet at first', label: 'Quiet at first' },
];

const LIFESTYLE_TRAVEL_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Explorer', label: 'Explorer' },
  { value: 'Sunbed snoozer', label: 'Sunbed snoozer' },
  { value: 'Sights & siesta', label: 'Sights & siesta' },
  { value: 'Beach and pool', label: 'Beach and pool' },
];

const LIFESTYLE_GOING_OUT_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: "Let's go out somewhere", label: "Let's go out somewhere" },
  { value: 'Sofa-snacks-and-a-film', label: 'Sofa-snacks-and-a-film' },
  { value: 'Decide together', label: 'Decide together' },
];

const FOOD_MOOD_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Burns water', label: 'Burns water' },
  { value: 'Microwave maestro', label: 'Microwave maestro' },
  { value: 'Not too bad', label: 'Not too bad' },
  { value: 'Ninja in the kitchen', label: 'Ninja in the kitchen' },
];

const FALLBACK_COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands',
];

// Helper from web — turn a photo id / partial path into a fully resolved URL.
const getPhotoUrl = (idOrUrl) => {
  if (!idOrUrl) return '';
  if (idOrUrl.startsWith('http')) return idOrUrl;
  if (idOrUrl.startsWith('/api/photos/serve/')) return `${API_URL}${idOrUrl}`;
  if (idOrUrl.startsWith('/api/photos/')) {
    const uuid = idOrUrl.replace('/api/photos/', '');
    return `${API_URL}/api/photos/serve/${uuid}`;
  }
  return `${API_URL}/api/photos/serve/${idOrUrl}`;
};

// ---- Reusable picker (modal) ----
function PickerField({ label, value, options, onChange, testID }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={s.selectField} testID={testID}>
        <Text style={[s.selectValue, !value && { color: 'rgba(196, 181, 253, 0.5)' }]}>
          {selected?.label || 'Select...'}
        </Text>
        <ChevronDown size={16} color="rgba(196, 181, 253, 0.5)" />
      </Pressable>
      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <X size={20} color="#cbd5e1" />
              </Pressable>
            </View>
            <ScrollView>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => { onChange(opt.value); setOpen(false); }}
                    style={({ pressed }) => [
                      s.option,
                      pressed && { backgroundColor: 'rgba(168, 85, 247, 0.1)' },
                    ]}
                  >
                    <Text style={[s.optionLabel, isSelected && { color: '#c084fc', fontWeight: '600' }]}>
                      {opt.label}
                    </Text>
                    {isSelected && <Check size={16} color="#c084fc" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ---- Glass toggle row ----
function ToggleRow({ icon: Icon, title, subtitle, value, onToggle, accent = 'purple', loading }) {
  const accentColors = {
    purple: { bg: 'rgba(168, 85, 247, 0.3)', icon: '#c084fc', track: ['#a855f7', '#ec4899'] },
    pink: { bg: 'rgba(236, 72, 153, 0.3)', icon: '#f472b6', track: ['#ec4899', '#a855f7'] },
    amber: { bg: 'rgba(251, 191, 36, 0.3)', icon: '#fbbf24', track: ['#fbbf24', '#f97316'] },
    emerald: { bg: 'rgba(16, 185, 129, 0.3)', icon: '#34d399', track: ['#10b981', '#14b8a6'] },
    rainbow: { bg: 'rgba(168, 85, 247, 0.2)', icon: '#fff', track: ['#a855f7', '#f97316'] },
  };
  const ac = accentColors[accent] || accentColors.purple;

  return (
    <View style={s.toggleCard}>
      <View style={s.toggleRow}>
        <View style={[s.toggleIcon, { backgroundColor: value ? ac.bg : 'rgba(255,255,255,0.05)' }]}>
          {typeof Icon === 'string' ? (
            <Text style={{ fontSize: 16 }}>{Icon}</Text>
          ) : (
            Icon && <Icon size={16} color={value ? ac.icon : 'rgba(196, 181, 253, 0.5)'} />
          )}
        </View>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[s.toggleTitle, value && { color: '#fff' }]}>{title}</Text>
          {subtitle ? <Text style={s.toggleSubtitle}>{subtitle}</Text> : null}
        </View>
        {loading ? (
          <ActivityIndicator color="#c084fc" />
        ) : (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: ac.track[0] }}
            thumbColor="#fff"
          />
        )}
      </View>
    </View>
  );
}

// ---- Section header ----
function SectionHeader({ icon: Icon, title, subtitle, gradient = ['rgba(168,85,247,0.2)', 'rgba(236,72,153,0.2)'] }) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIcon, { backgroundColor: gradient[0] }]}>
        {Icon && <Icon size={20} color="#c084fc" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

// ---- Main component ----
const EditProfileScreen = ({ navigation, route }) => {
  const { user, updateUser, logout } = useAuth();
  const isFirstTime = route?.params?.firstTime === true;

  const [saving, setSaving] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [hidePhotoInVenues, setHidePhotoInVenues] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [countries, setCountries] = useState(FALLBACK_COUNTRIES);
  const initialLoadDoneRef = useRef(false);

  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    photos: ['', '', ''],
    presence_note: '',
    intent: '',
    home_country: '',
    home_area: '',
    shy_indicator: false,
    show_as: '',
    seeking: [],
    rainbow: false,
    open_to_all: false,
    lifestyle_vibe: '',
    lifestyle_travel: '',
    lifestyle_going_out: '',
    food_mood: '',
  });

  // Initial load (mirror of web behaviour) - hydrate from user only ONCE
  useEffect(() => {
    if (user && !initialLoadDoneRef.current) {
      setFormData({
        display_name: user.display_name || '',
        bio: user.bio || '',
        photos: (user.photos && user.photos.length >= 3) ? user.photos.slice(0, 3) : [...(user.photos || []), '', '', ''].slice(0, 3),
        presence_note: user.presence_note || '',
        intent: user.intent || '',
        home_country: user.home_country || '',
        home_area: user.home_area || '',
        shy_indicator: user.shy_indicator || false,
        show_as: user.show_as || '',
        seeking: user.seeking || [],
        rainbow: user.rainbow || false,
        open_to_all: user.open_to_all || false,
        lifestyle_vibe: user.lifestyle_vibe || '',
        lifestyle_travel: user.lifestyle_travel || '',
        lifestyle_going_out: user.lifestyle_going_out || '',
        food_mood: user.food_mood || '',
      });
      setFormInitialized(true);
      initialLoadDoneRef.current = true;
      fetchPrivacySettings();
    }
  }, [user]);

  // Countries list (same as web)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/countries');
        if (res.data?.countries?.length > 0) setCountries(res.data.countries);
      } catch { /* fall back to FALLBACK_COUNTRIES */ }
    })();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const res = await settingsAPI.getPrivacy();
      setHidePhotoInVenues(res.data.hide_photo_in_venues || false);
    } catch { /* default false */ }
  };

  // Auto-save for optional fields (Lifestyle / Food Mood / shy / rainbow / open / seeking)
  const autoSave = async (fieldUpdate) => {
    if (!formInitialized) return;
    try {
      const res = await authAPI.updateProfile(fieldUpdate);
      updateUser(res.data);
    } catch (e) {
      // Silent fail, mirrors web behaviour
    }
  };

  const handleToggleHidePhotoInVenues = async () => {
    const newValue = !hidePhotoInVenues;
    setHidePhotoInVenues(newValue);
    setPrivacyLoading(true);
    try {
      await settingsAPI.updatePrivacy({ hide_photo_in_venues: newValue });
    } catch {
      setHidePhotoInVenues(!newValue);
      Alert.alert('Failed', 'Could not update setting');
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const res = await api.put('/api/auth/visibility');
      updateUser({ is_visible: res.data.is_visible });
    } catch {
      Alert.alert('Failed', 'Could not update visibility');
    }
  };

  // Photo upload via expo-image-picker → multipart upload.
  // CRITICAL: web and native need different FormData payloads.
  //  - native (RN): can append { uri, name, type } pseudo-File object
  //  - web:        must fetch the blob: URI, convert to a real Blob, then append
  const handlePhotoPick = async (slot) => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Too large', 'Photo must be under 5MB');
      return;
    }

    setUploadingPhoto(slot);
    const fd = new FormData();
    const fileName = asset.fileName || `photo-${slot}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';

    try {
      if (Platform.OS === 'web') {
        // On web, asset.uri is typically a blob: URL - fetch it to get the real Blob
        const blobRes = await fetch(asset.uri);
        const blob = await blobRes.blob();
        // The 3rd argument (filename) is critical so the server sees content_type
        const file = new File([blob], fileName, { type: blob.type || mimeType });
        fd.append('file', file);
      } else {
        // React Native multipart trick - this object is recognized by the RN FormData polyfill
        fd.append('file', {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        });
      }
      fd.append('slot', String(slot));

      const response = await photosAPI.upload(fd);
      const updatedPhotos = response.data.photos || [...formData.photos];
      while (updatedPhotos.length < 3) updatedPhotos.push('');
      setFormData((p) => ({ ...p, photos: updatedPhotos.slice(0, 3) }));
      updateUser({
        photos: updatedPhotos,
        avatar_url: slot === 0 ? (response.data.photo_id || response.data.url) : user?.avatar_url,
      });
    } catch (err) {
      console.log('[photo upload] failed:', err?.message, err?.response?.data);
      Alert.alert('Upload failed', err.response?.data?.detail || err?.message || 'Please try again.');
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handlePhotoDelete = async (slot) => {
    try {
      const response = await photosAPI.delete(slot);
      const updatedPhotos = response.data.photos || [...formData.photos];
      while (updatedPhotos.length < 3) updatedPhotos.push('');
      setFormData((p) => ({ ...p, photos: updatedPhotos.slice(0, 3) }));
      updateUser({
        photos: updatedPhotos,
        avatar_url: slot === 0 ? '' : user?.avatar_url,
      });
    } catch (err) {
      Alert.alert('Failed', 'Could not remove photo.');
    }
  };

  // Save (port of web validation + payload)
  const handleSave = async () => {
    if (!formInitialized) {
      Alert.alert('Wait', 'Please wait for your profile to load.');
      return;
    }
    if (!formData.bio || formData.bio.trim().length === 0) {
      Alert.alert('Required', "Please add something about yourself in the 'About me' field.");
      return;
    }
    if (formData.bio.trim().length < MIN_BIO_LENGTH) {
      Alert.alert('Too short', 'Add a short line so people get a sense of your vibe (at least 10 characters).');
      return;
    }
    if (!formData.home_country) {
      Alert.alert('Required', 'Please select your country.');
      return;
    }
    if (!formData.home_area || formData.home_area.trim().length < 3) {
      Alert.alert('Required', 'Home area must be at least 3 characters.');
      return;
    }
    if (!formData.seeking || formData.seeking.length === 0) {
      Alert.alert('Required', "Please select who you're interested in meeting.");
      return;
    }
    if (!formData.intent) {
      Alert.alert('Required', "Please select what you're here for.");
      return;
    }

    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        bio: formData.bio,
        presence_note: formData.presence_note,
        intent: formData.intent,
        home_country: formData.home_country,
        home_area: formData.home_area,
        shy_indicator: formData.shy_indicator,
        show_as: formData.show_as,
        seeking: formData.seeking,
        rainbow: formData.rainbow,
        open_to_all: formData.open_to_all,
        lifestyle_vibe: formData.lifestyle_vibe,
        lifestyle_travel: formData.lifestyle_travel,
        lifestyle_going_out: formData.lifestyle_going_out,
        food_mood: formData.food_mood,
        profile_complete: true,
      });
      updateUser({ ...res.data, profile_complete: true });
      if (!isFirstTime && navigation.canGoBack()) {
        navigation.goBack();
      }
      // First-time: navigator re-renders to MainTabs once profile_complete=true.
    } catch (e) {
      Alert.alert('Failed', e.response?.data?.detail || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSeeking = (which) => {
    const current = formData.seeking || [];
    const next = current.includes(which) ? current.filter((s) => s !== which) : [...current, which];
    setFormData({ ...formData, seeking: next });
    autoSave({ seeking: next });
  };

  const mainPhoto = formData.photos[0];
  const canGoBack = !isFirstTime && navigation.canGoBack();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        {canGoBack ? (
          <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
        ) : (
          <View style={s.headerBtn} />
        )}
        <Text style={s.headerTitle}>{isFirstTime ? 'Set Up Your Profile' : 'Edit Profile'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#c084fc" /> : <Text style={s.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ===== Photos Section ===== */}
          <View style={s.photoSection}>
            <View style={s.sectionHeaderRow}>
              <View>
                <Text style={s.sectionTitle}>Photos</Text>
                <Text style={s.sectionSubtitle}>Tap to add or change · auto-saved</Text>
              </View>
            </View>

            <View style={s.photoGrid}>
              {/* Main photo (large) */}
              <Pressable
                style={s.mainPhotoBox}
                onPress={() => !mainPhoto && handlePhotoPick(0)}
              >
                {mainPhoto ? (
                  <>
                    <Image source={{ uri: getPhotoUrl(mainPhoto) }} style={s.photoImg} />
                    <View style={s.photoOverlay}>
                      <Pressable onPress={() => handlePhotoPick(0)} style={s.photoActionBtn}>
                        <Text style={s.photoActionText}>Change</Text>
                      </Pressable>
                      <Pressable onPress={() => handlePhotoDelete(0)} style={s.photoDeleteBtn}>
                        <X size={14} color="#fca5a5" />
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <View style={s.photoPlaceholder}>
                    <View style={s.photoPlaceholderIcon}>
                      <Camera size={28} color="#c084fc" />
                    </View>
                    <Text style={s.photoPlaceholderText}>Add main photo</Text>
                  </View>
                )}
                {uploadingPhoto === 0 && (
                  <View style={s.photoLoading}>
                    <ActivityIndicator color="#c084fc" size="large" />
                  </View>
                )}
              </Pressable>

              {/* Two secondary photos column */}
              <View style={s.secondaryColumn}>
                {[1, 2].map((idx) => (
                  <Pressable
                    key={idx}
                    style={s.secondaryPhotoBox}
                    onPress={() => !formData.photos[idx] && handlePhotoPick(idx)}
                  >
                    {formData.photos[idx] ? (
                      <>
                        <Image source={{ uri: getPhotoUrl(formData.photos[idx]) }} style={s.photoImg} />
                        <Pressable
                          onPress={() => handlePhotoDelete(idx)}
                          style={s.smallDeleteBtn}
                        >
                          <X size={12} color="#fca5a5" />
                        </Pressable>
                      </>
                    ) : (
                      <View style={s.smallPlaceholder}>
                        <Plus size={22} color="rgba(192, 132, 252, 0.6)" />
                      </View>
                    )}
                    {uploadingPhoto === idx && (
                      <View style={s.photoLoading}>
                        <ActivityIndicator color="#c084fc" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Name + age line */}
            <View style={s.nameRow}>
              <View>
                <Text style={s.nameText}>{formData.display_name}</Text>
                <Text style={s.ageText}>
                  {user?.age ? `${user.age} years old` : 'Age not set'}
                </Text>
              </View>
            </View>
          </View>

          {/* ===== Quick Controls ===== */}
          <SectionHeader
            icon={Users}
            title="Quick controls"
            subtitle="Toggle these anytime"
            gradient={['rgba(168, 85, 247, 0.2)', 'rgba(236, 72, 153, 0.2)']}
          />
          <ToggleRow
            icon={Heart}
            title="I'm feeling shy today"
            subtitle='Shows "May be shy to start" on your profile'
            value={formData.shy_indicator}
            accent="pink"
            onToggle={() => {
              const next = !formData.shy_indicator;
              setFormData({ ...formData, shy_indicator: next });
              autoSave({ shy_indicator: next });
            }}
          />
          <ToggleRow
            icon={user?.is_visible ? Eye : EyeOff}
            title="Hide me from discovery"
            subtitle={user?.is_visible ? "You're visible to others" : "You won't appear in discovery"}
            value={!user?.is_visible}
            accent="amber"
            onToggle={handleToggleVisibility}
          />
          <ToggleRow
            icon={UserIcon}
            title="Hide my photo in venues"
            subtitle="Shows a silhouette instead of your photo in venue lists"
            value={hidePhotoInVenues}
            accent="emerald"
            loading={privacyLoading}
            onToggle={handleToggleHidePhotoInVenues}
          />

          <View style={s.divider} />

          {/* ===== Presence Note ===== */}
          <View style={s.section}>
            <Text style={s.sectionH2}>Presence Note</Text>
            <Text style={s.sectionSubtitle}>
              A tiny hint of who you are — visible even while blurred
            </Text>
            <TextInput
              value={formData.presence_note}
              onChangeText={(v) => setFormData({ ...formData, presence_note: v })}
              placeholder="e.g., Here for good vibes..."
              placeholderTextColor="rgba(196, 181, 253, 0.4)"
              maxLength={MAX_PRESENCE_NOTE_LENGTH}
              style={s.input}
            />
            <Text style={s.counter}>
              {formData.presence_note.length}/{MAX_PRESENCE_NOTE_LENGTH}
            </Text>
          </View>

          {/* ===== About You ===== */}
          <View style={s.section}>
            <Text style={s.sectionH2}>About You</Text>
            <Text style={s.sectionSubtitle}>Information visible after mutual reveal</Text>
            <TextInput
              value={formData.bio}
              onChangeText={(v) => setFormData({ ...formData, bio: v })}
              placeholder="Share a little about yourself..."
              placeholderTextColor="rgba(196, 181, 253, 0.4)"
              maxLength={MAX_BIO_LENGTH}
              multiline
              style={[s.input, s.textarea]}
            />
            <View style={s.counterRow}>
              <Text style={s.counterMin}>Minimum {MIN_BIO_LENGTH} characters</Text>
              <Text style={s.counter}>{formData.bio.length}/{MAX_BIO_LENGTH}</Text>
            </View>
          </View>

          {/* ===== Lifestyle ===== */}
          <View style={s.section}>
            <Text style={s.sectionH2}>Lifestyle</Text>
            <Text style={s.sectionSubtitle}>Optional - visible to everyone</Text>

            <Text style={s.fieldLabel}>Are you more lively or more laid-back?</Text>
            <PickerField
              label="Lifestyle vibe"
              value={formData.lifestyle_vibe}
              options={LIFESTYLE_VIBE_OPTIONS}
              onChange={(v) => {
                setFormData({ ...formData, lifestyle_vibe: v });
                autoSave({ lifestyle_vibe: v });
              }}
            />

            <Text style={s.fieldLabel}>More of an explorer or more of a sunbed-snoozer?</Text>
            <PickerField
              label="Travel style"
              value={formData.lifestyle_travel}
              options={LIFESTYLE_TRAVEL_OPTIONS}
              onChange={(v) => {
                setFormData({ ...formData, lifestyle_travel: v });
                autoSave({ lifestyle_travel: v });
              }}
            />

            <Text style={s.fieldLabel}>More of a going out person or sofa-snacks-and-a-film?</Text>
            <PickerField
              label="Going out"
              value={formData.lifestyle_going_out}
              options={LIFESTYLE_GOING_OUT_OPTIONS}
              onChange={(v) => {
                setFormData({ ...formData, lifestyle_going_out: v });
                autoSave({ lifestyle_going_out: v });
              }}
            />
          </View>

          {/* ===== Food Mood ===== */}
          <View style={s.section}>
            <Text style={s.sectionH2}>Food Mood</Text>
            <Text style={s.sectionSubtitle}>Optional - visible to everyone</Text>
            <Text style={s.fieldLabel}>How are you in the kitchen?</Text>
            <PickerField
              label="Food mood"
              value={formData.food_mood}
              options={FOOD_MOOD_OPTIONS}
              onChange={(v) => {
                setFormData({ ...formData, food_mood: v });
                autoSave({ food_mood: v });
              }}
            />
          </View>

          <View style={s.divider} />

          {/* ===== Gender & Identity ===== */}
          <SectionHeader
            icon={UserIcon}
            title="Gender & Identity"
            subtitle="Controls who sees you and who you see"
            gradient={['rgba(59, 130, 246, 0.2)', 'rgba(236, 72, 153, 0.2)']}
          />

          {/* Show-as (read-only — set during signup) */}
          <View style={[s.section, { paddingVertical: 12 }]}>
            <Text style={s.smallLabel}>I appear as</Text>
            <Text style={[
              s.identityValue,
              formData.show_as === 'male' && { color: '#93c5fd' },
              formData.show_as === 'female' && { color: '#f9a8d4' },
              !formData.show_as && { color: '#94a3b8' },
            ]}>
              {formData.show_as === 'male' ? 'Male' : formData.show_as === 'female' ? 'Female' : 'Not set'}
            </Text>
            <Text style={s.helperSmall}>
              To update your gender, name or date of birth, please email hereandnow.social.uk@gmail.com
            </Text>
          </View>

          {/* Seeking (multi-select M / F) */}
          <View style={[s.section, { paddingTop: 0 }]}>
            <Text style={s.smallLabel}>I'm looking to meet</Text>
            <Text style={s.helperSmall}>Select one <Text style={{ textDecorationLine: 'underline' }}>or</Text> <Text style={{ fontWeight: '700' }}>both</Text></Text>
            <View style={s.seekingRow}>
              <Pressable
                onPress={() => toggleSeeking('male')}
                style={[
                  s.seekingBtn,
                  (formData.seeking || []).includes('male') && { borderColor: '#60a5fa', backgroundColor: 'rgba(59,130,246,0.2)' },
                ]}
              >
                <View style={[
                  s.seekingChip,
                  (formData.seeking || []).includes('male') && { backgroundColor: 'rgba(59,130,246,0.3)' },
                ]}>
                  <Text style={[
                    s.seekingChipText,
                    (formData.seeking || []).includes('male') && { color: '#93c5fd' },
                  ]}>M</Text>
                </View>
                <Text style={[
                  s.seekingLabel,
                  (formData.seeking || []).includes('male') && { color: '#bfdbfe' },
                ]}>Men</Text>
              </Pressable>

              <Pressable
                onPress={() => toggleSeeking('female')}
                style={[
                  s.seekingBtn,
                  (formData.seeking || []).includes('female') && { borderColor: '#f472b6', backgroundColor: 'rgba(236,72,153,0.2)' },
                ]}
              >
                <View style={[
                  s.seekingChip,
                  (formData.seeking || []).includes('female') && { backgroundColor: 'rgba(236,72,153,0.3)' },
                ]}>
                  <Text style={[
                    s.seekingChipText,
                    (formData.seeking || []).includes('female') && { color: '#f9a8d4' },
                  ]}>F</Text>
                </View>
                <Text style={[
                  s.seekingLabel,
                  (formData.seeking || []).includes('female') && { color: '#fbcfe8' },
                ]}>Women</Text>
              </Pressable>
            </View>
          </View>

          <ToggleRow
            icon="🌈"
            title="Rainbow / Rainbow-friendly"
            subtitle="I'm LGBTQ+ and/or open to seeing LGBTQ+ people."
            value={formData.rainbow}
            accent="rainbow"
            onToggle={() => {
              const next = !formData.rainbow;
              setFormData({ ...formData, rainbow: next });
              autoSave({ rainbow: next });
            }}
          />
          <ToggleRow
            icon="🤗"
            title="Open to everyone"
            subtitle="I'm happy to connect with anyone."
            value={formData.open_to_all}
            accent="amber"
            onToggle={() => {
              const next = !formData.open_to_all;
              setFormData({ ...formData, open_to_all: next });
              autoSave({ open_to_all: next });
            }}
          />

          <View style={s.section}>
            <Text style={s.fieldLabel}>What are you here for?</Text>
            <PickerField
              label="Intent"
              value={formData.intent}
              options={INTENT_OPTIONS}
              onChange={(v) => setFormData({ ...formData, intent: v })}
            />
          </View>

          <View style={s.divider} />

          {/* ===== Home Area ===== */}
          <SectionHeader
            icon={Home}
            title="Home area"
            subtitle="Where you're based (shown after reveal)"
            gradient={['rgba(20, 184, 166, 0.2)', 'rgba(16, 185, 129, 0.2)']}
          />
          <View style={s.section}>
            <Text style={s.smallLabel}>Country *</Text>
            <PickerField
              label="Country"
              value={formData.home_country}
              options={[{ value: '', label: 'Select your country...' }, ...countries.map((c) => ({ value: c, label: c }))]}
              onChange={(v) => setFormData({ ...formData, home_country: v })}
            />

            <Text style={[s.smallLabel, { marginTop: 14 }]}>Town or City *</Text>
            <TextInput
              value={formData.home_area}
              onChangeText={(v) => setFormData({ ...formData, home_area: v })}
              placeholder="e.g. Manchester, Brooklyn, Sydney..."
              placeholderTextColor="rgba(196, 181, 253, 0.4)"
              maxLength={50}
              style={s.input}
            />
            <Text style={s.helperSmall}>
              Set this to your home town. Here & Now uses your real-time location wherever you are.
            </Text>
          </View>

          <View style={{ height: 32 }} />

          {/* Sign out (only useful during onboarding when there's no bottom nav yet) */}
          <Pressable
            onPress={() => {
              Alert.alert('Sign out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => logout() },
              ]);
            }}
            style={s.signOutBtn}
          >
            <Text style={s.signOutText}>Sign out</Text>
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---- Styles ----
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.1)',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  saveBtn: {
    color: '#c084fc',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scroll: { padding: 16, gap: 12 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 8 },
  sectionIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { color: '#e9d5ff', fontSize: 17, fontWeight: '600' },
  sectionSubtitle: { color: 'rgba(196, 181, 253, 0.7)', fontSize: 13, marginTop: 2 },
  sectionH2: { color: '#e9d5ff', fontSize: 17, fontWeight: '500', marginBottom: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  // Photos
  photoSection: { gap: 12 },
  photoGrid: { flexDirection: 'row', gap: 12 },
  mainPhotoBox: {
    flex: 2,
    aspectRatio: 3 / 4,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  secondaryColumn: { flex: 1, gap: 12 },
  secondaryPhotoBox: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  photoPlaceholderIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholderText: { color: 'rgba(196, 181, 253, 0.7)', fontSize: 13 },
  smallPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoOverlay: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', gap: 8,
  },
  photoActionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center',
  },
  photoActionText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  photoDeleteBtn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  smallDeleteBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  photoLoading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginTop: 4 },
  nameText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  ageText: { color: 'rgba(196, 181, 253, 0.7)', fontSize: 13, marginTop: 2 },

  // Toggle card
  toggleCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  toggleTitle: { color: 'rgba(196, 181, 253, 0.7)', fontSize: 14, fontWeight: '500' },
  toggleSubtitle: { color: 'rgba(196, 181, 253, 0.55)', fontSize: 11, marginTop: 2 },

  // Section / inputs
  section: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    gap: 8,
  },
  input: {
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    color: '#fff',
    fontSize: 15,
  },
  textarea: { height: 110, paddingTop: 14, textAlignVertical: 'top' },
  counter: { color: 'rgba(196, 181, 253, 0.7)', fontSize: 11, textAlign: 'right' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  counterMin: { color: 'rgba(196, 181, 253, 0.7)', fontSize: 11 },
  fieldLabel: { color: 'rgba(196, 181, 253, 0.8)', fontSize: 13, marginTop: 8 },
  smallLabel: { color: 'rgba(196, 181, 253, 0.7)', fontSize: 12, fontWeight: '500' },
  helperSmall: { color: 'rgba(196, 181, 253, 0.55)', fontSize: 11, marginTop: 4 },

  // Picker field
  selectField: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { color: '#fff', fontSize: 14, flex: 1 },

  // Modal picker
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '70%',
    borderTopWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168, 85, 247, 0.15)',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  optionLabel: { color: '#e9d5ff', fontSize: 15 },

  // Identity
  identityValue: { fontSize: 15, fontWeight: '600', marginVertical: 4 },

  // Seeking
  seekingRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  seekingBtn: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  seekingChip: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  seekingChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  seekingLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: '500' },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    marginVertical: 4,
  },

  // Sign out button (visible during onboarding only because there's no nav bar yet)
  signOutBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  signOutText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EditProfileScreen;
