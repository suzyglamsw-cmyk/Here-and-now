/**
 * ProfilePreview — direct React Native port of the Profile Preview Modal block
 * from frontend/src/pages/ProfileTab.js (web), lines 1799-2478.
 *
 * Renders three reveal-states UNCHANGED:
 *   - "unmatched"            (heavy blur 12px)
 *   - "connection_accepted"  (medium blur 6px)
 *   - "revealed"             (clear, photo carousel + voice intro)
 *
 * NOTHING has been re-designed, re-imagined, or refactored. The only
 * transformations are unavoidable:
 *   div          → View
 *   h1/h3/h4/p/span → Text
 *   button       → Pressable
 *   img          → Image
 *   className/Tailwind → StyleSheet
 *   filter:blur(Xpx) → expo-blur BlurView overlay (works on RN Web + native)
 *   new Audio()  → expo-av Audio.Sound (RN equivalent of HTMLAudioElement)
 *
 * Conditional rendering, copy, ordering, icons, colours and obscureBioText
 * usage are preserved 1:1 with the source.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import {
  X, EyeOff, Eye, Sparkles, Crown, MapPin, MessageCircle, Heart,
  User as UserIcon, ChevronLeft, ChevronRight, Play, Pause,
} from 'lucide-react-native';

import { obscureBioText } from '../utils/bioObscure';
import { API_URL } from '../utils/constants';

// Same getPhotoUrl logic as web ProfileTab.js (lines 16-29)
const getPhotoUrl = (photoIdOrUrl) => {
  if (!photoIdOrUrl) return '';
  if (photoIdOrUrl.startsWith('http')) return photoIdOrUrl;
  if (photoIdOrUrl.startsWith('/api/photos/serve/')) return `${API_URL}${photoIdOrUrl}`;
  if (photoIdOrUrl.startsWith('/api/photos/')) {
    const uuid = photoIdOrUrl.replace('/api/photos/', '');
    return `${API_URL}/api/photos/serve/${uuid}`;
  }
  return `${API_URL}/api/photos/serve/${photoIdOrUrl}`;
};

const { width: SCREEN_W } = Dimensions.get('window');

const ProfilePreview = ({ visible, onClose, formData = {}, user = null }) => {
  // State mirrored from ProfileTab.js (lines 124-126, 140)
  const [previewMode, setPreviewMode] = useState('unmatched'); // "unmatched" | "connection_accepted" | "revealed"
  const [previewAudioPlaying, setPreviewAudioPlaying] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);
  const previewAudioRef = useRef(null);

  // Computed values mirrored from lines 796-803, 806-812
  const mainPhoto = formData.photos?.[0] || user?.avatar_url;
  const allPhotos = (formData.photos || []).filter((p) => p && p.trim() !== '');
  const hasMultiplePhotos = allPhotos.length > 1;
  const isPremium = user?.is_premium === true;

  const handleNextPhoto = () => {
    setPreviewPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };
  const handlePrevPhoto = () => {
    setPreviewPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  // Stop audio when modal closes / unmounts
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.unloadAsync().catch(() => {});
        previewAudioRef.current = null;
      }
    };
  }, []);

  const handleClose = async () => {
    if (previewAudioRef.current) {
      try {
        await previewAudioRef.current.stopAsync();
        await previewAudioRef.current.unloadAsync();
      } catch (e) { /* ignore */ }
      previewAudioRef.current = null;
    }
    setPreviewAudioPlaying(false);
    onClose?.();
  };

  // Voice intro toggle (lines 2422-2440)
  const handleVoiceToggle = async () => {
    try {
      if (previewAudioPlaying && previewAudioRef.current) {
        await previewAudioRef.current.pauseAsync();
        setPreviewAudioPlaying(false);
        return;
      }
      const audioUrl = formData.voice_intro_url?.startsWith('http')
        ? formData.voice_intro_url
        : `${API_URL}${formData.voice_intro_url?.replace('/api/', '/api/') || ''}`;
      if (!audioUrl) return;
      if (previewAudioRef.current) {
        await previewAudioRef.current.unloadAsync().catch(() => {});
        previewAudioRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true });
      previewAudioRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPreviewAudioPlaying(false);
      });
      setPreviewAudioPlaying(true);
    } catch (e) {
      // toast.error("Failed to play voice intro") — silent in RN
      setPreviewAudioPlaying(false);
    }
  };

  // -------- Reusable bits used in all three states --------

  // Premium badge (lines 1902-1907, 2069-2074, 2278-2284) — identical in all states
  const PremiumBadge = () =>
    isPremium ? (
      <View style={styles.premiumBadge}>
        <Crown size={14} color="#fff" />
        <Text style={styles.premiumBadgeText}>Premium</Text>
      </View>
    ) : null;

  // Identity icon group (show_as / rainbow / open_to_all) — identical in all states
  const IconGroup = () => (
    <View style={styles.iconGroup}>
      {formData.show_as ? (
        <View
          style={[
            styles.identityChip,
            formData.show_as === 'male' ? styles.identityChipMale : styles.identityChipFemale,
          ]}
        >
          <Text style={styles.identityChipText}>
            {formData.show_as === 'male' ? 'M' : 'F'}
          </Text>
        </View>
      ) : null}
      {formData.rainbow ? (
        <View style={styles.rainbowChip}>
          {/* Rainbow gradient simulated with stacked tints — preserves the gradient pill look */}
          <View style={[styles.rainbowSlice, { backgroundColor: '#ef4444' }]} />
          <View style={[styles.rainbowSlice, { backgroundColor: '#f97316' }]} />
          <View style={[styles.rainbowSlice, { backgroundColor: '#eab308' }]} />
          <View style={[styles.rainbowSlice, { backgroundColor: '#22c55e' }]} />
          <View style={[styles.rainbowSlice, { backgroundColor: '#3b82f6' }]} />
          <View style={[styles.rainbowSlice, { backgroundColor: '#8b5cf6' }]} />
          <View style={styles.rainbowDot} />
        </View>
      ) : null}
      {formData.open_to_all ? (
        <View style={styles.openToAllChip}>
          <Text style={{ fontSize: 12 }}>🤗</Text>
        </View>
      ) : null}
    </View>
  );

  // Intent badge (lines 1948-1958)
  const IntentBadge = () => {
    if (!formData.intent) return null;
    const intentStyle =
      formData.intent === 'dating'
        ? styles.intentDating
        : formData.intent === 'friends'
          ? styles.intentFriends
          : styles.intentOther;
    const intentLabel =
      formData.intent === 'dating'
        ? 'Dating'
        : formData.intent === 'friends'
          ? 'Friends'
          : formData.intent === 'open_to_both'
            ? 'Open to both'
            : '';
    return (
      <View style={[styles.intentBadgeWrap, intentStyle]}>
        <Text style={[styles.intentBadgeText, intentStyle]}>{intentLabel}</Text>
      </View>
    );
  };

  // Lifestyle / Food Mood / About sections — visible in all 3 states
  const LifestyleSection = () => {
    if (!(formData.lifestyle_vibe || formData.lifestyle_travel || formData.lifestyle_going_out)) {
      return null;
    }
    return (
      <View style={styles.softCard}>
        <Text style={styles.softCardLabel}>LIFESTYLE</Text>
        <View style={{ gap: 8 }}>
          {formData.lifestyle_vibe ? (
            <View>
              <Text style={styles.softCardSubKey}>Lively or laid-back?</Text>
              <Text style={styles.softCardValue}>{formData.lifestyle_vibe}</Text>
            </View>
          ) : null}
          {formData.lifestyle_travel ? (
            <View>
              <Text style={styles.softCardSubKey}>Explorer or sunbed-snoozer?</Text>
              <Text style={styles.softCardValue}>{formData.lifestyle_travel}</Text>
            </View>
          ) : null}
          {formData.lifestyle_going_out ? (
            <View>
              <Text style={styles.softCardSubKey}>Going out or staying in?</Text>
              <Text style={styles.softCardValue}>{formData.lifestyle_going_out}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const FoodMoodSection = () => {
    if (!formData.food_mood) return null;
    return (
      <View style={styles.softCard}>
        <Text style={styles.softCardLabel}>FOOD MOOD</Text>
        <View>
          <Text style={styles.softCardSubKey}>In the kitchen?</Text>
          <Text style={styles.softCardValue}>{formData.food_mood}</Text>
        </View>
      </View>
    );
  };

  const BasedInSection = () => {
    if (!(formData.home_country || formData.home_area)) return null;
    return (
      <View style={styles.softCard}>
        <Text style={styles.softCardLabel}>BASED IN</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} color="#2dd4bf" />
          <Text style={styles.softCardValue}>
            {formData.home_area && formData.home_country
              ? `${formData.home_area}, ${formData.home_country}`
              : formData.home_area || formData.home_country}
          </Text>
        </View>
      </View>
    );
  };

  // Photo + initial-only overlay (used in unmatched & connection_accepted)
  const renderInitialOnlyPhotoCard = (blurIntensity) => (
    <View style={styles.photoCard}>
      {allPhotos.length > 0 ? (
        <Image
          source={{ uri: getPhotoUrl(allPhotos[previewPhotoIndex] || mainPhoto) }}
          style={styles.photoFill}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <UserIcon size={64} color="rgba(192, 132, 252, 0.5)" />
        </View>
      )}
      {/* Apply blur overlay (preserves the web `filter: blur(Xpx)` behaviour) */}
      {allPhotos.length > 0 ? (
        Platform.OS === 'web' ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              // RN-Web supports the `filter` style prop directly on Views/Images
              // eslint-disable-next-line react-native/no-inline-styles
              { backdropFilter: `blur(${blurIntensity === 100 ? 12 : 6}px)` },
            ]}
          />
        ) : (
          <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
        )
      ) : null}
      {/* Bottom gradient — exact analog of web's `bg-gradient-to-t from-black/60 to-transparent` */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <PremiumBadge />

      {/* Pre-match info overlay - INITIAL only */}
      <View style={styles.infoOverlay}>
        <View style={styles.nameRow}>
          <View style={styles.nameLeft}>
            <Text style={styles.nameText} numberOfLines={1}>
              {(formData.display_name || '?').charAt(0)}
            </Text>
            {user?.age ? <Text style={styles.ageText}>{user.age}</Text> : null}
          </View>
          <IconGroup />
        </View>
        <IntentBadge />
        {formData.presence_note ? (
          <Text style={styles.presenceNote}>{formData.presence_note}</Text>
        ) : null}
      </View>
    </View>
  );

  // Full photo + carousel + full-name overlay (revealed state)
  const renderRevealedPhotoCard = () => (
    <View style={styles.photoCard}>
      {allPhotos.length > 0 ? (
        <Image
          source={{ uri: getPhotoUrl(allPhotos[previewPhotoIndex] || mainPhoto) }}
          style={styles.photoFill}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <UserIcon size={64} color="rgba(192, 132, 252, 0.5)" />
        </View>
      )}
      <View style={styles.bottomGradient}>
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {hasMultiplePhotos ? (
        <>
          <Pressable onPress={handlePrevPhoto} style={[styles.carouselNav, { left: 8 }]}>
            <ChevronLeft size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={handleNextPhoto} style={[styles.carouselNav, { right: 8 }]}>
            <ChevronRight size={20} color="#fff" />
          </Pressable>
          <View style={styles.dotsRow}>
            {allPhotos.map((_, idx) => (
              <Pressable
                key={idx}
                onPress={() => setPreviewPhotoIndex(idx)}
                style={[styles.dot, idx === previewPhotoIndex ? styles.dotActive : null]}
              />
            ))}
          </View>
        </>
      ) : null}

      <PremiumBadge />

      <View style={styles.infoOverlay}>
        <View style={styles.nameRow}>
          <View style={styles.nameLeft}>
            <Text style={styles.nameText} numberOfLines={1}>
              {formData.display_name || 'Your Name'}
            </Text>
            {user?.age ? <Text style={styles.ageText}>{user.age}</Text> : null}
          </View>
          <IconGroup />
        </View>
        <IntentBadge />
        {formData.presence_note ? (
          <Text style={styles.presenceNote}>{formData.presence_note}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.root} edges={['top']}>
        {/* Header (lines 1803-1872) */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profile Preview</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn} testID="close-preview-btn">
              <X size={20} color="#c4b5fd" />
            </Pressable>
          </View>

          {/* Mode toggle - three states */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => { setPreviewMode('unmatched'); setPreviewPhotoIndex(0); }}
              style={[styles.tab, previewMode === 'unmatched' && styles.tabActive]}
              testID="preview-unmatched-tab"
            >
              <EyeOff size={14} color={previewMode === 'unmatched' ? '#fff' : 'rgba(196, 181, 253, 0.6)'} />
              <Text style={[styles.tabText, previewMode === 'unmatched' && styles.tabTextActive]}>
                Unmatched
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setPreviewMode('connection_accepted'); setPreviewPhotoIndex(0); }}
              style={[styles.tab, previewMode === 'connection_accepted' && styles.tabActive]}
              testID="preview-connection-tab"
            >
              <Eye size={14} color={previewMode === 'connection_accepted' ? '#fff' : 'rgba(196, 181, 253, 0.6)'} />
              <Text style={[styles.tabText, previewMode === 'connection_accepted' && styles.tabTextActive]}>
                Connected
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setPreviewMode('revealed'); setPreviewPhotoIndex(0); }}
              style={[styles.tab, previewMode === 'revealed' && styles.tabActive]}
              testID="preview-revealed-tab"
            >
              <Sparkles size={14} color={previewMode === 'revealed' ? '#fff' : 'rgba(196, 181, 253, 0.6)'} />
              <Text style={[styles.tabText, previewMode === 'revealed' && styles.tabTextActive]}>
                Revealed
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Preview content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ============================================ */}
          {/* UNMATCHED STATE - HEAVY BLUR (12px)         */}
          {/* ============================================ */}
          {previewMode === 'unmatched' ? (
            <View style={{ gap: 24 }}>
              <Text style={styles.modeHelper}>This is how others see you before matching</Text>

              {renderInitialOnlyPhotoCard(100 /* heavy blur ≈ 12px */)}

              <LifestyleSection />
              <FoodMoodSection />

              {formData.bio ? (
                <View style={[styles.softCard, styles.softCardNarrow]}>
                  <Text style={styles.softCardLabel}>ABOUT</Text>
                  <Text style={styles.softCardValue}>{obscureBioText(formData.bio, false)}</Text>
                </View>
              ) : null}

              {/* Hidden fields indicator - No reveal button */}
              <View style={styles.hiddenChipsRow}>
                <View style={styles.hiddenChip}>
                  <EyeOff size={12} color="rgba(196, 181, 253, 0.6)" />
                  <Text style={styles.hiddenChipText}>Name hidden</Text>
                </View>
                <View style={styles.hiddenChip}>
                  <EyeOff size={12} color="rgba(196, 181, 253, 0.6)" />
                  <Text style={styles.hiddenChipText}>Additional photos locked</Text>
                </View>
              </View>

              <Text style={styles.smallDim}>No reveal button visible before matching</Text>

              <BasedInSection />
            </View>
          ) : null}

          {/* ============================================ */}
          {/* CONNECTION_ACCEPTED STATE - MEDIUM BLUR (6px) */}
          {/* ============================================ */}
          {previewMode === 'connection_accepted' ? (
            <View style={{ gap: 24 }}>
              <Text style={styles.modeHelper}>
                This is how others see you after connecting (before reveal)
              </Text>

              {renderInitialOnlyPhotoCard(50 /* medium blur ≈ 6px */)}

              <LifestyleSection />
              <FoodMoodSection />

              {formData.bio ? (
                <View style={[styles.softCard, styles.softCardNarrow]}>
                  <Text style={styles.softCardLabel}>ABOUT</Text>
                  <Text style={styles.softCardValue}>{obscureBioText(formData.bio, true)}</Text>
                </View>
              ) : null}

              {/* Disabled Message Button */}
              <View style={{ alignSelf: 'center', width: '100%', maxWidth: 320 }}>
                <Pressable disabled style={styles.messageBtn}>
                  <MessageCircle size={20} color="#fff" />
                  <Text style={styles.messageBtnText}>Message</Text>
                </Pressable>
                <Text style={styles.btnHint}>(Messaging unlocked after mutual match)</Text>
              </View>

              {/* Disabled Reveal Button */}
              <View style={{ alignSelf: 'center', width: '100%', maxWidth: 320 }}>
                <Pressable disabled style={styles.revealBtn}>
                  <Eye size={20} color="#fff" />
                  <Text style={styles.revealBtnText}>Reveal me</Text>
                </Pressable>
                <Text style={styles.btnHint}>
                  (This button would reveal your photo to the matched user)
                </Text>
              </View>

              <BasedInSection />
            </View>
          ) : null}

          {/* ============================================ */}
          {/* REVEALED STATE - CLEAR (0px blur)           */}
          {/* ============================================ */}
          {previewMode === 'revealed' ? (
            <View style={{ gap: 16 }}>
              <Text style={styles.modeHelper}>This is how others see you after mutual reveal</Text>

              {renderRevealedPhotoCard()}

              <LifestyleSection />
              <FoodMoodSection />

              {formData.bio ? (
                <View style={styles.softCard}>
                  <Text style={styles.softCardLabel}>ABOUT</Text>
                  <Text style={styles.softCardValue}>{formData.bio}</Text>
                </View>
              ) : null}

              {formData.my_type_of_person ? (
                <View style={styles.softCard}>
                  <Text style={styles.softCardLabel}>MY TYPE OF PERSON IS</Text>
                  <Text style={styles.softCardValue}>{formData.my_type_of_person}</Text>
                </View>
              ) : null}

              {formData.intent ? (
                <View style={styles.softCard}>
                  <Text style={styles.softCardLabel}>HERE FOR</Text>
                  <Text style={[styles.softCardValue, { textTransform: 'capitalize' }]}>
                    {String(formData.intent).replace('_', ' ')}
                  </Text>
                </View>
              ) : null}

              {(formData.home_country || formData.home_area) ? (
                <View style={styles.softCard}>
                  <Text style={styles.softCardLabel}>BASED IN</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MapPin size={16} color="#2dd4bf" />
                    <Text style={styles.softCardValue}>
                      {formData.home_area && formData.home_country
                        ? `${formData.home_area}, ${formData.home_country}`
                        : formData.home_area || formData.home_country}
                    </Text>
                  </View>
                </View>
              ) : null}

              {formData.voice_intro_url ? (
                <View style={styles.softCard}>
                  <Text style={styles.softCardLabel}>VOICE INTRO</Text>
                  <Pressable
                    onPress={handleVoiceToggle}
                    style={[
                      styles.voiceBtn,
                      previewAudioPlaying ? styles.voiceBtnActive : styles.voiceBtnIdle,
                    ]}
                  >
                    <View
                      style={[
                        styles.voiceIconWrap,
                        previewAudioPlaying ? styles.voiceIconWrapActive : styles.voiceIconWrapIdle,
                      ]}
                    >
                      {previewAudioPlaying ? (
                        <Pause size={20} color="#fff" />
                      ) : (
                        <Play size={20} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.voiceBtnText}>
                      {previewAudioPlaying ? 'Playing...' : 'Play Voice Intro'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {formData.shy_indicator ? (
                <View style={styles.shyRow}>
                  <Heart size={20} color="#f472b6" />
                  <Text style={styles.shyText}>May be shy to start</Text>
                </View>
              ) : null}

              {/* Note: who_open_to_meeting is NEVER shown - private matching only */}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f0a1a',
  },

  // Header
  header: {
    backgroundColor: 'rgba(15, 10, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxWidth: 512,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    color: '#ede9fe',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    maxWidth: 512,
    alignSelf: 'center',
    width: '95%',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#a855f7',
  },
  tabText: {
    color: 'rgba(196, 181, 253, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 96,
    maxWidth: 512,
    alignSelf: 'center',
    width: '100%',
  },

  modeHelper: {
    fontSize: 14,
    color: 'rgba(196, 181, 253, 0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },

  // Photo card (3:4)
  photoCard: {
    aspectRatio: 3 / 4,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  photoFill: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // Slightly taller than 50% so the fade reaches further up and the
    // info-overlay text remains readable against bright photos. The
    // colour comes from <LinearGradient> itself — never set a
    // backgroundColor here or you'll re-introduce the hard horizontal seam.
    height: '60%',
  },

  // Premium badge
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f59e0b',
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  // Info overlay (bottom of photo)
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  nameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  ageText: {
    color: 'rgba(233, 213, 255, 0.7)',
    fontSize: 16,
  },
  presenceNote: {
    color: 'rgba(243, 232, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },

  // Identity icon group
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginLeft: 8,
  },
  identityChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityChipMale: { backgroundColor: 'rgba(96, 165, 250, 0.9)' },
  identityChipFemale: { backgroundColor: 'rgba(244, 114, 182, 0.9)' },
  identityChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  rainbowChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rainbowSlice: {
    width: 4,
    height: 24,
  },
  rainbowDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  openToAllChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Intent badge
  intentBadgeWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
  },
  intentBadgeText: {
    fontSize: 12,
  },
  intentDating: {
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    color: '#f9a8d4',
  },
  intentFriends: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    color: '#6ee7b7',
  },
  intentOther: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    color: '#d8b4fe',
  },

  // Carousel
  carouselNav: {
    position: 'absolute',
    top: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -16 }],
  },
  dotsRow: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },

  // Soft cards (lifestyle / food / about / based in / etc.)
  softCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  softCardNarrow: {
    maxWidth: 320,
    width: '100%',
    alignSelf: 'center',
  },
  softCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(196, 181, 253, 0.6)',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  softCardSubKey: {
    color: 'rgba(196, 181, 253, 0.7)',
    fontSize: 12,
  },
  softCardValue: {
    color: '#ede9fe',
    fontSize: 14,
  },

  // Hidden chips row
  hiddenChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  hiddenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  hiddenChipText: {
    color: 'rgba(196, 181, 253, 0.6)',
    fontSize: 12,
  },
  smallDim: {
    textAlign: 'center',
    color: 'rgba(196, 181, 253, 0.4)',
    fontSize: 12,
  },

  // Connection_accepted buttons
  messageBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.7,
  },
  messageBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  revealBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.7,
  },
  revealBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  btnHint: {
    textAlign: 'center',
    color: 'rgba(196, 181, 253, 0.4)',
    fontSize: 12,
    marginTop: 8,
  },

  // Voice intro button
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  voiceBtnIdle: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  voiceBtnActive: {
    backgroundColor: '#a855f7',
  },
  voiceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIconWrapIdle: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  voiceIconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  voiceBtnText: {
    color: '#e9d5ff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Shy
  shyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  shyText: {
    color: '#f9a8d4',
    fontSize: 14,
  },
});

export default ProfilePreview;
