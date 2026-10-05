import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, Music, Sliders, MapPin, Globe, Lock, Bookmark, Check, ArrowRight, Sparkles, UserPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { usePostStore } from '../../src/stores/postStore';
import { useOfflineStore } from '../../src/stores/offlineStore';
import { CameraView } from '../../src/components/create/CameraView';
import { SoundPicker } from '../../src/components/create/SoundPicker';
import { PRESET_LOCATIONS } from '../../src/constants/data';
import { VISUAL_FILTERS } from '../../src/constants/filters';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { Toast } from '../../src/components/ui/Toast';
import { noOutline } from '../../src/stores/shared/constants';
import { api } from '../../src/api/client';

const FILTER_OVERLAYS: Record<string, string> = {
  sunset: '#E8753A', pepper: '#8B4513', mist: '#7B9EB0', neon: '#FF6EC7',
  gold: '#D4AF37', jungle: '#228B22', kep: '#FFB07C', vhs: '#FF00FF', noir: '#000000',
};

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ duetPostId?: string }>();
  const isDuetMode = !!params.duetPostId;
  const { currentUser } = useAuthStore();
  const { publishPost } = usePostStore();
  const { isOfflineSimulated, toggleOffline, addDraft } = useOfflineStore();

  const [step, setStep] = useState<'capture' | 'edit' | 'uploading'>('capture');
  const [mediaType, setMediaType] = useState<'video' | 'photo'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMediaUri, setCapturedMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState(VISUAL_FILTERS[0]);
  const [hashtags, setHashtags] = useState('');
  const [showSounds, setShowSounds] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const playerSource = capturedMediaUri && mediaType === 'video' ? { uri: capturedMediaUri } : null;
  const player = useVideoPlayer(playerSource, (p: any) => { if (p) { p.loop = true; p.muted = true; } });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => { setToast(null); toastTimer.current = null; }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  // Auto-sync drafts when online — with user confirmation
  useEffect(() => {
    const syncDrafts = async () => {
      const state = useOfflineStore.getState();
      if (state.drafts.length === 0 || state.isSyncing) return;
      // Ask user before uploading drafts
      Alert.alert(
        'Upload Drafts',
        `You have ${state.drafts.length} pending draft${state.drafts.length > 1 ? 's' : ''}. Upload now?`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upload', onPress: async () => {
            state.setSyncing(true);
            for (let i = 0; i < state.drafts.length; i++) {
              const draft = state.drafts[i];
              if (draft.capturedMediaUri) {
                try {
                  const formData = new FormData();
                  const filename = draft.capturedMediaUri.split('/').pop() || 'draft.mp4';
                  formData.append('file', { uri: draft.capturedMediaUri, name: filename, type: draft.mediaType === 'video' ? 'video/mp4' : 'image/jpeg' } as any);
                  if (draft.caption) formData.append('caption', draft.caption);
                  if (draft.location) formData.append('locationTag', draft.location);
                  formData.append('visibility', draft.visibility || 'public');
                  formData.append('commentsEnabled', String(draft.commentsEnabled !== false));
                  await publishPost(formData);
                } catch (e) { console.error(e); }
              }
              state.setSyncProgress((i + 1) / state.drafts.length * 100);
            }
            useOfflineStore.setState({ drafts: [], isSyncing: false, syncProgress: 0 });
          }},
        ]
      );
    };
    syncDrafts();
  }, [publishPost]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCancelUpload = useCallback(() => {
    setStep('capture');
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  const handlePublish = useCallback(async () => {
    if (!capturedMediaUri) {
      showToast('No media captured');
      return;
    }
    setIsUploading(true);
    setStep('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      const ext = capturedMediaUri.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
      const filename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';

      formData.append('file', { uri: capturedMediaUri, name: filename, type: mimeType } as any);
      const tagString = hashtags ? ' ' + hashtags.split(' ').filter(Boolean).map(t => `#${t.replace('#', '')}`).join(' ') : '';
      const fullCaption = (caption || '') + tagString;
      formData.append('caption', fullCaption);
      if (location) formData.append('locationTag', location);
      formData.append('visibility', visibility);
      formData.append('commentsEnabled', String(commentsEnabled));
      if (selectedFilter.id !== 'none') {
        formData.append('filterId', selectedFilter.id);
      }
      if (selectedSound) {
        formData.append('soundId', selectedSound.id);
        formData.append('soundName', selectedSound.title);
        formData.append('soundCreator', selectedSound.creator);
      }

      await publishPost(formData);
      setUploadProgress(100);
      const navTimer = setTimeout(() => router.replace('/(tabs)'), 500);
      navTimeoutRef.current = navTimer;
      showToast('Posted successfully!');
    } catch (e: any) {
      showToast(e.message || 'Upload failed');
      setStep('edit');
    } finally {
      setIsUploading(false);
    }
  }, [capturedMediaUri, mediaType, caption, hashtags, location, visibility, commentsEnabled,
      selectedSound, publishPost, showToast]);

  const handleOpenGallery = useCallback(async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          setCapturedMediaUri(URL.createObjectURL(file));
          setMediaType(file.type.startsWith('video/') ? 'video' : 'photo');
          setStep('edit');
        }
      };
      input.click();
      return;
    }
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCapturedMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'photo');
      setStep('edit');
    }
  }, []);

  if (!currentUser || currentUser.role === 'guest') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
          <Sparkles size={24} color={colors.textMuted} />
        </View>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.lg, marginBottom: spacing.sm, textAlign: 'center' }}>Sign up to upload clips!</Text>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 20, paddingHorizontal: spacing.xl }}>Create an account to share your videos and photos with the TokLok community.</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/welcome')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.accent, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.lg }}>
          <UserPlus size={16} color={colors.white} />
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.sm }}>Create account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(auth)/welcome?step=login')} style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm }}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : 'padding'} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><X size={18} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 'capture' ? 'Create Post' : step === 'edit' ? 'Post Details' : 'Processing'}</Text>
        <TouchableOpacity onPress={toggleOffline} style={[styles.statusBadge, isOfflineSimulated ? styles.offlineBadge : styles.onlineBadge]}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isOfflineSimulated ? '#f59e0b' : colors.success }} />
          <Text style={[styles.statusText, { color: isOfflineSimulated ? '#f59e0b' : colors.success }]}>{isOfflineSimulated ? 'Offline' : 'Online'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flex: step === 'edit' ? 0 : 1 }} style={{ flex: 1 }}>
        {step === 'capture' && (
          <CameraView
            isRecording={isRecording}
            isDuet={isDuetMode}
            selectedSound={selectedSound}
            selectedFilter={selectedFilter}
            onStartRecording={() => setIsRecording(true)}
            onStopRecording={() => { setIsRecording(false); setStep('edit'); }}
            onMediaCapture={(uri, type) => { setCapturedMediaUri(uri); setMediaType(type); }}
            onTakePhoto={() => setStep('edit')}
            onToggleFlash={() => {}}
            onFlipCamera={() => {}}
            onOpenGallery={handleOpenGallery}
            onSelectFilter={(f) => setSelectedFilter(f)}
            onOpenSounds={() => setShowSounds(true)}
            onOpenFilters={() => setShowFilters(true)}
          />
        )}

        {step === 'edit' && (
          <View style={styles.editSection}>
            <View style={styles.previewBox}>
              {capturedMediaUri ? (
                <View style={{ flex: 1 }}>
                  {mediaType === 'video' && player ? (
                    <VideoView
                      style={{ flex: 1 }}
                      player={player}
                      contentFit="cover"
                      nativeControls
                    />
                  ) : mediaType === 'video' && !player ? (
                    <View style={[styles.previewPlaceholder, { backgroundColor: colors.black }]}>
                      <ActivityIndicator size="large" color={colors.accent} />
                      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm }}>Preparing video...</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: capturedMediaUri }} style={{ flex: 1, resizeMode: 'cover' }} />
                  )}
                  {selectedFilter.id !== 'none' && (
                    <>
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: FILTER_OVERLAYS[selectedFilter.id] || 'transparent', opacity: 0.25 }} />
                      <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                        <Text style={{ color: colors.white, fontSize: 9, fontWeight: '700' }}>🎨 {selectedFilter.name}</Text>
                      </View>
                    </>
                  )}
                  <TouchableOpacity
                    onPress={() => setStep('capture')}
                    style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                  >
                    <Text style={{ color: colors.white, fontSize: fontSize.xs, fontWeight: '600' }}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Sparkles size={20} color={colors.accent} />
                  <Text style={styles.previewType}>No media captured</Text>
                </View>
              )}
            </View>

            <View style={{ gap: spacing.md }}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={150}
                style={[styles.captionInput, noOutline]}
              />

              <TextInput
                value={hashtags}
                onChangeText={setHashtags}
                placeholder="Add hashtags (separate with spaces)"
                placeholderTextColor={colors.textMuted}
                style={[styles.locationInput, noOutline]}
              />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: -8 }}>
                Tags: {hashtags ? hashtags.split(' ').filter(Boolean).map(t => `#${t.replace('#', '')}`).join(' ') : 'none'}
              </Text>

              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Location tag"
                placeholderTextColor={colors.textMuted}
                style={[styles.locationInput, noOutline]}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {PRESET_LOCATIONS.map((loc) => (
                  <TouchableOpacity key={loc} onPress={() => setLocation(loc)} style={[styles.locationChip, location === loc && styles.locationChipActive]}>
                    <Text style={[styles.locationChipText, location === loc && styles.locationChipTextActive]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.settingsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Visibility</Text>
                  <TouchableOpacity onPress={() => setVisibility(visibility === 'public' ? 'followers' : visibility === 'followers' ? 'private' : 'public')} style={styles.settingBtn}>
                    {visibility === 'public' ? <Globe size={12} color={colors.textMuted} /> : visibility === 'followers' ? <Bookmark size={12} /> : <Lock size={12} />}
                    <Text style={styles.settingBtnText}>{visibility}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Comments</Text>
                  <TouchableOpacity onPress={() => setCommentsEnabled(!commentsEnabled)} style={styles.settingBtn}>
                    <Text style={styles.settingBtnText}>{commentsEnabled ? 'Enabled' : 'Disabled'}</Text>
                    <View style={[styles.dot, commentsEnabled ? styles.dotGreen : styles.dotRed]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={async () => {
                  const draftData = { caption, hashtags, location, visibility, commentsEnabled, selectedSound, selectedFilter, capturedMediaUri, mediaType };
                  addDraft(draftData);
                  // Also save to server if online
                  try { await api.drafts.save({ caption, locationTag: location, visibility, commentsEnabled }); } catch (e) { console.error(e); }
                  setDraftSaved(true);
                  const t = setTimeout(() => setDraftSaved(false), 1200);
                  toastTimer.current = t;
                }} style={styles.draftBtn}>
                  {draftSaved ? <><Check size={14} color={colors.success} /><Text style={{ color: colors.success, fontWeight: '700', fontSize: fontSize.sm }}>Saved!</Text></> : <Text style={styles.draftBtnText}>Save Draft</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePublish} style={styles.publishBtn}>
                  <Text style={styles.publishBtnText}>{isOfflineSimulated ? 'Queue Offline' : 'Publish'}</Text>
                  <ArrowRight size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {step === 'uploading' && (
          <View style={styles.uploadSection}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.uploadTitle}>{isOfflineSimulated ? 'Preparing Draft' : 'Publishing'}</Text>
            <Text style={styles.uploadSub}>Uploading your media to the server.</Text>
            {!isOfflineSimulated && (
              <>
                <View style={{ width: '80%', maxWidth: 280, height: 6, backgroundColor: colors.bgCard, borderRadius: 3, overflow: 'hidden', marginTop: spacing.md }}>
                  <View style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: colors.accent, borderRadius: 3 }} />
                </View>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>{uploadProgress}%</Text>
              </>
            )}
            <TouchableOpacity onPress={handleCancelUpload} style={{ marginTop: spacing.lg, padding: spacing.md }}>
              <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Toast message={toast} />
      <SoundPicker
        visible={showSounds}
        selectedSoundId={selectedSound?.id}
        onSelect={(sound) => setSelectedSound(sound)}
        onClose={() => setShowSounds(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 9999 },
  onlineBadge: { backgroundColor: 'rgba(99,153,34,0.1)', borderWidth: 1, borderColor: 'rgba(99,153,34,0.2)' },
  offlineBadge: { backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  statusText: { fontSize: 8, fontWeight: '700' },
  editSection: { padding: spacing.lg, gap: spacing.lg },
  previewBox: { aspectRatio: 16 / 9, backgroundColor: colors.black, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  previewPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  previewType: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  previewFilter: { color: colors.textMuted, fontSize: fontSize.xs },
  captionInput: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, color: colors.text, fontSize: fontSize.sm, minHeight: 80, textAlignVertical: 'top' },
  locationInput: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, color: colors.text, fontSize: fontSize.sm },
  locationChip: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, marginRight: spacing.xs },
  locationChipActive: { borderColor: colors.accent, backgroundColor: 'rgba(216,90,48,0.1)' },
  locationChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  locationChipTextActive: { color: colors.accent },
  settingsRow: { flexDirection: 'row', gap: spacing.md },
  settingLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', marginBottom: spacing.xs },
  settingBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm },
  settingBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotGreen: { backgroundColor: colors.success },
  dotRed: { backgroundColor: colors.danger },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  draftBtn: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  draftBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  publishBtn: { flex: 1, backgroundColor: colors.accent, padding: spacing.md, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  publishBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  uploadSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  uploadTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  uploadSub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', maxWidth: 240 },
});


