import { memo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Play, Layers, Heart, MapPin } from 'lucide-react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { formatCount } from '../../utils/format';

interface PostGridCardProps {
  post: {
    id: string;
    type?: string;
    coverThumbnailUrl?: string;
    mediaUrls?: string[];
    username?: string;
    likeCount?: number;
    viewCount?: number;
    caption?: string;
    locationTag?: string;
  };
  width?: number;
  showViewCount?: boolean;
}

export const PostGridCard = memo(function PostGridCard({ post, width = 180, showViewCount = false }: PostGridCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = post.coverThumbnailUrl || post.mediaUrls?.[0] || '';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/post/${post.id}`)}
      style={[styles.card, { width }]}
    >
      {imageUrl && !imageError ? (
        <Image source={{ uri: imageUrl }} style={styles.image} onError={() => setImageError(true)} />
      ) : (
        <View style={styles.fallback}>
          <Text style={{ fontSize: 24, color: colors.textMuted }}>📷</Text>
        </View>
      )}
      <View style={styles.typeBadge}>
        {post.type === 'video' ? <Play size={10} color={colors.white} /> : null}
        {post.type === 'carousel' ? <Layers size={10} color={colors.white} /> : null}
      </View>
      {post.locationTag && (
        <View style={styles.locationBadge}>
          <MapPin size={7} color={colors.accent} />
          <Text style={styles.locationText}>{post.locationTag.split(',')[0]}</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <Text style={styles.username} numberOfLines={1}>@{post.username}</Text>
        {showViewCount && post.viewCount ? (
          <Text style={styles.count}>{formatCount(post.viewCount)}</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Heart size={8} color={colors.accent} fill={colors.accent} />
            <Text style={styles.count}>{formatCount(post.likeCount || 0)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: { aspectRatio: 3 / 4, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  fallback: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgCard },
  typeBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: borderRadius.sm },
  locationBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, gap: 2 },
  locationText: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.sm, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  username: { color: colors.text, fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
  count: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
});
