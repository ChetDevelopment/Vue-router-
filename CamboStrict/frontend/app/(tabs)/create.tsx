import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Music, Sliders, MapPin, Globe, Lock, CloudOff, Wifi, Check, ArrowRight, Sparkles, Keyboard, Bookmark } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { usePostStore } from '../../src/stores/postStore';
import { useOfflineStore } from '../../src/stores/offlineStore';
import { CameraView } from '../../src/components/create/CameraView';
import { TRENDING_SOUNDS, PRESET_LOCATIONS } from '../../src/constants/data';
import { VISUAL_FILTERS } from '../../src/constants/filters';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { Toast } from '../../src/components/ui/Toast';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const { publishPost } = usePostStore();
  const { isOfflineSimulated, toggleOffline, addDraft } = useOfflineStore();

  const [step, setStep] = useState<'capture' | 'edit' | 'uploading'>('capture');
  const [mediaType, setMediaType] = useState<'video' | 'photo'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState(VISUAL_FILTERS[0]);
  const [showSounds, setShowSounds] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draftSaved, setDraftSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handlePublish = () => {
    setStep('uploading');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          const postData = {
            id: `post_${Date.now()}`,
            userId: currentUser?.id || '',
            username: currentUser?.username || '',
            userAvatar: currentUser?.avatarUrl || '',
            userDisplayName: currentUser?.displayName || '',
            isUserVerified: currentUser?.isVerified || false,
            type: mediaType,
            mediaUrls: ['https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&h=1200'],
            coverThumbnailUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&h=1000',
            caption: caption || 'Check out my post on TokLok!',
            locationTag: location || undefined,
            visibility,
            commentsEnabled,
            likeCount: 0, commentCount: 0, shareCount: 0,
            createdAt: new Date().toISOString(),
            isLikedByUser: false, isBookmarkedByUser: false, isFollowingCreator: false,
            soundId: selectedSound?.id,
            soundName: selectedSound?.title,
            soundCreator: selectedSound?.creator,
          };
          if (isOfflineSimulated) {
            addDraft(postData);
            showToast('Offline draft saved!');
          } else {
            publishPost(postData as any);
            showToast('Posted successfully!');
          }
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  if (currentUser?.role === 'guest') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>Sign up to upload clips!</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {}}><X size={15} color={colors.textMuted} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 'capture' ? 'Create Post' : step === 'edit' ? 'Post Details' : 'Processing'}</Text>
        <View style={[styles.statusBadge, isOfflineSimulated ? styles.offlineBadge : styles.onlineBadge]}>
          {isOfflineSimulated ? <CloudOff size={10} color="#F59E0B" /> : <Wifi size={10} color={colors.success} />}
          <Text style={[styles.statusText, { color: isOfflineSimulated ? '#F59E0B' : colors.success }]}>
            {isOfflineSimulated ? 'OFFLINE' : 'ONLINE'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flex: step === 'edit' ? 0 : 1 }} style={{ flex: 1 }}>
        {step === 'capture' && (
          <CameraView
            isRecording={isRecording}
            isDuet={false}
            selectedSound={selectedSound}
            selectedFilter={selectedFilter}
            onStartRecording={() => setIsRecording(true)}
            onStopRecording={() => { setIsRecording(false); setStep('edit'); }}
            onTakePhoto={() => setStep('edit')}
            onToggleFlash={() => {}}
            onFlipCamera={() => {}}
            onOpenGallery={() => {}}
            onOpenSounds={() => setShowSounds(true)}
            onOpenFilters={() => setShowFilters(true)}
          />
        )}

        {step === 'edit' && (
          <View style={styles.editSection}>
            <View style={styles.previewBox}>
              <View style={styles.previewPlaceholder}>
                <Sparkles size={20} color={colors.accent} />
                <Text style={styles.previewType}>{mediaType.toUpperCase()}</Text>
                {selectedFilter.id !== 'none' && <Text style={styles.previewFilter}>FILTER: {selectedFilter.id.toUpperCase()}</Text>}
              </View>
            </View>

            <View style={{ gap: spacing.md }}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption..."
                placeholderTextColor={colors.textMuted}
                multiline
                style={styles.captionInput}
              />

              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Location tag"
                placeholderTextColor={colors.textMuted}
                style={styles.locationInput}
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
                <TouchableOpacity onPress={() => { addDraft({ caption }); setDraftSaved(true); setTimeout(() => setDraftSaved(false), 1200); }} style={styles.draftBtn}>
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
            <View style={styles.uploadIcon}>
              <Text style={styles.uploadIconText}>⚡</Text>
            </View>
            <Text style={styles.uploadTitle}>{isOfflineSimulated ? 'Compressing Draft' : 'Compressing Media'}</Text>
            <Text style={styles.uploadSub}>Applying local compression for low networks.</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
      </ScrollView>

      <Toast message={toast} />
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
  uploadIcon: { width: 64, height: 64, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, justifyContent: 'center', alignItems: 'center' },
  uploadIconText: { fontSize: 24 },
  uploadTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  uploadSub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', maxWidth: 240 },
  progressBar: { width: '100%', maxWidth: 280, height: 6, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  progressText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
});


