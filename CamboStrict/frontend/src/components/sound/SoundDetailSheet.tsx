import { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Modal, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { X, Music, Play } from 'lucide-react-native';
import { usePostStore } from '../../stores/postStore';
import { api } from '../../api/client';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { formatCount } from '../../utils/format';

interface SoundDetailSheetProps {
  soundId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function SoundDetailSheet({ soundId, visible, onClose }: SoundDetailSheetProps) {
  const { posts } = usePostStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<any>(null);
  const [sound, setSound] = useState<any>(null);

  useEffect(() => {
    if (soundId && visible) {
      api.sounds.get(soundId).then(setSound).catch(() => setSound(null));
    } else {
      setSound(null);
    }
  }, [soundId, visible]);

  useEffect(() => {
    if (!visible) {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
    }
  }, [visible]);

  const relatedPosts = useMemo(
    () => posts.filter((p) => p.soundId === soundId || p.soundName === sound?.title),
    [posts, soundId, sound]
  );

  const togglePlay = async () => {
    if (Platform.OS === 'web') return;
    if (isPlaying && soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      return;
    }
    if (!sound?.audioUrl) return;
    try {
      setIsLoading(true);
      const Audio = await import('expo-av').then(m => m.Audio);
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: sound.audioUrl },
          { shouldPlay: true }
        );
        soundRef.current = newSound;
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            soundRef.current = null;
          }
        });
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(true);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{sound?.title || 'Sound Detail'}</Text>
            <TouchableOpacity onPress={onClose}><X size={18} color={colors.text} /></TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <Music size={24} color={colors.white} />
            </View>
            <Text style={styles.soundName}>{sound?.title || 'Unknown'}</Text>
            <Text style={styles.creatorName}>{sound?.creatorName || sound?.creator || 'Unknown creator'}</Text>
            {sound?.audioUrl ? (
              <TouchableOpacity onPress={togglePlay} style={styles.playBtn} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Play size={16} color={colors.white} />
                )}
                  <Text style={styles.playText}>{isPlaying ? 'Stop' : 'Preview'}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm }}>No preview available</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Posts using this sound ({relatedPosts.length})</Text>
          <FlatList
            data={relatedPosts.slice(0, 20)}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={{ gap: 2 }}
            contentContainerStyle={{ gap: 2 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { onClose(); router.push(`/post/${item.id}`); }} style={styles.gridItem}>
                <Image source={{ uri: item.coverThumbnailUrl }} style={styles.gridImage} />
                <View style={styles.playOverlay}>
                  <Play size={12} color={colors.white} />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '85%', paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  hero: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  soundName: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg, textAlign: 'center' },
  creatorName: { color: colors.textMuted, fontSize: fontSize.sm },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, marginTop: spacing.sm },
  playText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  sectionTitle: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.xs, textTransform: 'uppercase', padding: spacing.lg, paddingBottom: spacing.sm },
  gridItem: { flex: 1, aspectRatio: 1, backgroundColor: colors.bgCard },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
});
