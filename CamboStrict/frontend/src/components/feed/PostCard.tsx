import { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Heart, MessageCircle, Bookmark, Share2, Music, MapPin, Volume2, VolumeX } from 'lucide-react-native';
import { Post } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { formatCount } from '../../utils/format';
import { Avatar } from '../ui/Avatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  isActive: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onFollow: () => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onOpenReport: () => void;
  onRemix: () => void;
  onUseSound: () => void;
  currentUserId?: string;
}

export function PostCard({
  post,
  isActive,
  onLike,
  onBookmark,
  onFollow,
  onOpenComments,
  onOpenShare,
  onOpenReport,
  onRemix,
  onUseSound,
  currentUserId,
}: PostCardProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCaption, setShowCaption] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <View style={styles.container}>
      {post.type === 'video' && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: post.coverThumbnailUrl }} style={styles.media} />
          {!isPlaying && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
          )}
        </View>
      )}
      {post.type === 'photo' && (
        <Image source={{ uri: post.mediaUrls[0] }} style={styles.media} />
      )}

      <View style={styles.gradient} />

      <TouchableOpacity
        onPress={() => setIsMuted(!isMuted)}
        style={styles.muteButton}
      >
        {isMuted ? <VolumeX size={14} color={colors.white} /> : <Volume2 size={14} color={colors.white} />}
      </TouchableOpacity>

      <View style={styles.bottomContent}>
        <View style={styles.creatorRow}>
          <Avatar uri={post.userAvatar} size={36} isVerified={post.isUserVerified} />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName} numberOfLines={1}>{post.userDisplayName}</Text>
            {post.locationTag && (
              <View style={styles.locationRow}>
                <MapPin size={9} color={colors.accent} />
                <Text style={styles.locationText} numberOfLines={1}>{post.locationTag}</Text>
              </View>
            )}
          </View>
          {currentUserId && currentUserId !== post.userId && (
            <TouchableOpacity onPress={onFollow} style={styles.followButton}>
              <Text style={styles.followText}>{post.isFollowingCreator ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => setShowCaption(!showCaption)}>
          <Text style={styles.caption} numberOfLines={showCaption ? undefined : 2}>
            {post.caption}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onUseSound} style={styles.soundRow}>
          <Music size={11} color={colors.accent} />
          <Text style={styles.soundText} numberOfLines={1}>
            {post.soundName || `Original Audio - @${post.username}`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRail}>
        <ActionButton icon={Heart} count={formatCount(post.likeCount)} active={post.isLikedByUser} onPress={onLike} activeColor={colors.accent} />
        <ActionButton icon={MessageCircle} count={formatCount(post.commentCount)} onPress={onOpenComments} />
        <ActionButton icon={Bookmark} active={post.isBookmarkedByUser} onPress={onBookmark} activeColor={colors.accent} />
        <ActionButton icon={Share2} count={formatCount(post.shareCount)} onPress={onOpenShare} />
      </View>
    </View>
  );
}

function ActionButton({
  icon: Icon,
  count,
  active,
  onPress,
  activeColor = colors.text,
}: {
  icon: any;
  count?: string;
  active?: boolean;
  onPress: () => void;
  activeColor?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
      <View style={[styles.actionIcon, active && { backgroundColor: 'rgba(216,90,48,0.15)' }]}>
        <Icon size={22} color={active ? activeColor : colors.text} fill={active ? activeColor : 'none'} strokeWidth={1.8} />
      </View>
      {count && <Text style={styles.actionCount}>{count}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: Dimensions.get('window').height - 120,
    backgroundColor: colors.black,
    justifyContent: 'flex-end',
  },
  mediaContainer: { ...StyleSheet.absoluteFillObject },
  media: { width: '100%', height: '100%', resizeMode: 'cover' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { fontSize: 24, color: colors.white },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  muteButton: {
    position: 'absolute',
    top: 50,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 30,
    left: spacing.md,
    right: 70,
    zIndex: 20,
    gap: spacing.sm,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  creatorInfo: { flex: 1 },
  creatorName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: { color: colors.textMuted, fontSize: fontSize.xs },
  followButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  followText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  caption: { color: colors.text, fontSize: fontSize.sm, lineHeight: 18 },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  soundText: { color: colors.textMuted, fontSize: fontSize.xs, flex: 1 },
  actionRail: {
    position: 'absolute',
    right: spacing.md,
    bottom: 100,
    zIndex: 20,
    gap: spacing.lg,
    alignItems: 'center',
  },
  actionBtn: { alignItems: 'center', gap: 3 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCount: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },
});
