import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Play, FolderOpen } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatCount } from '../../src/utils/format';
import { useWindowDimensions } from 'react-native';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const CARD_W = (screenW - 48) / 2;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.collections.getPosts(id);
      setPosts(data || []);
      } catch (e) { console.warn('Failed to load collection', e); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleRemove = (postId: string) => {
    Alert.alert('Remove Post', 'Remove this post from the collection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.collections.removePost(id, postId);
          setPosts((prev) => prev.filter((p) => p.id !== postId));
        } catch (e) { console.error(e); }
      }},
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Collection</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={
            <View style={{ padding: 60, alignItems: 'center', gap: spacing.md }}>
              <FolderOpen size={48} color={colors.accent} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.md }}>No posts in this collection</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/post/${item.id}`)}
              onLongPress={() => handleRemove(item.id)}
              style={[styles.card, { width: CARD_W }]}
            >
              <Image source={{ uri: item.coverThumbnailUrl || item.cover_thumbnail_url || item.mediaUrls?.[0] }} style={styles.image} />
              <View style={styles.overlay}>
                <Text style={styles.user} numberOfLines={1}>@{item.username}</Text>
                <Heart size={8} color={colors.accent} fill={colors.accent} />
                <Text style={styles.likes}>{formatCount(item.likeCount || 0)}</Text>
              </View>
              {item.type === 'video' && (
                <View style={styles.typeBadge}>
                  <Play size={10} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  card: { aspectRatio: 3 / 4, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.bgCard },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.sm, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  user: { color: colors.text, fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
  likes: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
  typeBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: borderRadius.sm },
});
