import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Hash, Heart, Play, Layers, MapPin } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatCount } from '../../src/utils/format';
import { useWindowDimensions } from 'react-native';

export default function HashtagPage() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const CARD_W = (screenW - 48) / 2;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    api.hashtags.get(tag).then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tag]);

  const posts = data?.posts || [];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
        <Text style={s.topTitle}>#{tag}</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListHeaderComponent={
            <View style={s.header}>
              <View style={s.hashtagIcon}><Hash size={20} color={colors.accent} /></View>
              <Text style={s.hashtagName}>#{tag}</Text>
              <Text style={s.postCount}>{formatCount(data?.hashtag?.post_count || posts.length)} posts</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={{ padding: 60, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>No posts with this hashtag yet</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)} style={[s.card, { width: CARD_W }]}>
              <Image source={{ uri: item.coverThumbnailUrl || item.mediaUrls?.[0] }} style={s.image} />
              <View style={s.overlay}>
                <Text style={s.user} numberOfLines={1}>@{item.username}</Text>
                <Heart size={8} color={colors.accent} fill={colors.accent} />
                <Text style={s.likes}>{formatCount(item.likeCount || 0)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { padding: spacing.sm },
  topTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  header: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  hashtagIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(216,90,48,0.1)', justifyContent: 'center', alignItems: 'center' },
  hashtagName: { color: colors.text, fontWeight: '700', fontSize: fontSize.xl },
  postCount: { color: colors.textMuted, fontSize: fontSize.sm },
  card: { aspectRatio: 3 / 4, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.bgCard },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.sm, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  user: { color: colors.text, fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
  likes: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
});
