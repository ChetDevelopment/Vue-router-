import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Animated, StyleSheet, useWindowDimensions, Platform, Modal } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Heart, MessageCircle, Bookmark, Share2, Music, MapPin, Volume2, VolumeX, Info, FolderOpen, RefreshCw, Edit2, CheckCircle } from 'lucide-react-native';
import { Post } from '../../types';
import { colors, borderRadius, fontSize, spacing, TAB_BAR_HEIGHT } from '../../constants/theme';
import { formatCount, formatRelativeTime } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { ActionButton } from '../ui/ActionButton';

interface PostCardProps {
  post: Post;
  isActive: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onAddToCollection?: () => void;
  onRepost?: () => void;
  onEdit?: () => void;
  onFollow: () => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onUseSound: () => void;
  onReport?: () => void;
  currentUserId?: string;
}

export const PostCard = memo(function PostCard({
  post,
  isActive,
  onLike,
  onBookmark,
  onAddToCollection,
  onRepost,
  onEdit,
  onFollow,
  onOpenComments,
  onOpenShare,
  onUseSound,
  onReport,
  currentUserId,
}: PostCardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const mediaLoadedRef = useRef(false);
  const [showCaption, setShowCaption] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;

  const showHeartAnimation = useCallback(() => {
    heartScale.setValue(0.5);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.2, useNativeDriver: true, damping: 8, stiffness: 200 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 300 }),
    ]).start();
  }, [heartScale]);

  const mediaUrl = post.mediaUrls?.[0] || post.coverThumbnailUrl || '';
  const playerSource = Platform.OS !== 'web' && post.type === 'video' && mediaUrl ? { uri: mediaUrl } : null;
  const player = useVideoPlayer(playerSource, (p) => { if (p) { p.loop = true; p.muted = true; } });

  useEffect(() => {
    if (!player || post.type !== 'video') return;
    if (isActive) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
      player.muted = true;
    }
    return () => {
      if (!isActive) {
        player.pause();
        setIsPlaying(false);
      }
    };
  }, [isActive, post.type, player]);

  useEffect(() => {
    if (!player || post.type !== 'video') return;
    const sub = player.addListener('playingChange', (e) => {
      setIsPlaying(e.isPlaying);
      if (e.isPlaying && !mediaLoadedRef.current) {
        mediaLoadedRef.current = true;
        setMediaLoaded(true);
        setVideoError(false);
      }
    });
    // 10-second timeout for video loading
    const timeout = setTimeout(() => {
      if (!mediaLoadedRef.current) {
        setVideoError(true);
      }
    }, 10000);
    return () => { try { sub?.remove(); } catch (e) { console.error(e); }; clearTimeout(timeout); };
  }, [player, post.type]);

  const toggleMute = useCallback(() => {
    if (!player) return;
    setIsMuted((prev) => {
      const next = !prev;
      player.muted = next;
      return next;
    });
  }, [player]);

  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMediaTap = useCallback(() => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      onLike();
      showHeartAnimation();
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      togglePlay();
    }, 200);
  }, [onLike]);

  const togglePlay = useCallback(() => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const onImageLoad = useCallback(() => setMediaLoaded(true), []);

  return (
    <View style={[styles.container, { width: screenWidth, height: screenHeight - TAB_BAR_HEIGHT }]}>
      {/* Media — not a TouchableOpacity, so it doesn't block buttons */}
      <View style={styles.mediaContainer}>
        {post.type === 'video' && Platform.OS !== 'web' && player && (
          <>
            <VideoView player={player} style={styles.media} contentFit="cover" nativeControls={false} />
            {!mediaLoaded && !videoError && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            )}
            {videoError && (
              <View style={styles.loadingOverlay}>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.sm }}>Couldn't load this video</Text>
                <TouchableOpacity onPress={() => { setVideoError(false); mediaLoadedRef.current = false; player?.play(); }} style={{ backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md }}>
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.sm }}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {!isPlaying && mediaLoaded && !videoError && (
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </View>
            )}
          </>
        )}
        {post.type === 'video' && Platform.OS === 'web' && (
          <Image source={{ uri: mediaUrl }} style={styles.media} />
        )}
        {post.type === 'photo' && (
          <>
            <Image source={{ uri: mediaUrl }} style={styles.media} onLoad={onImageLoad} />
            {!mediaLoaded && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            )}
          </>
        )}
        {/* Transparent overlay for double-tap like — doesn't block buttons because it's zIndex 1 */}
        <TouchableOpacity activeOpacity={1} onPress={handleMediaTap} style={StyleSheet.absoluteFill} />
      </View>

      <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }], opacity: heartScale.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}>
        <Heart size={64} color={colors.white} fill={colors.white} />
      </Animated.View>

      <View style={styles.gradient} />

      <TouchableOpacity
        onPress={toggleMute}
        style={styles.muteButton}
      >
        {isMuted ? <VolumeX size={14} color={colors.white} /> : <Volume2 size={14} color={colors.white} />}
      </TouchableOpacity>

      {/* Bottom content with higher z-index so touches work */}
      <View style={styles.bottomContent}>
        <TouchableOpacity onPress={() => router.push(`/user/${post.userId}`)} style={styles.creatorRow}>
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
        </TouchableOpacity>

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
          <TouchableOpacity onPress={() => setShowWhy(!showWhy)}>
            <Info size={10} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
        {showWhy && (
          <View style={styles.whyBubble}>
            <Text style={styles.whyBubbleText}>
              {post.isFollowingCreator ? 'From a creator you follow' : post.locationTag ? `Trending near ${post.locationTag.split(',')[0]}` : 'Recommended for you'}
            </Text>
          </View>
        )}
      </View>

      {/* Action rail — now on top of everything */}
      <View style={styles.actionRail} pointerEvents="box-none">
        <ActionButton icon={Heart} count={formatCount(post.likeCount)} active={post.isLikedByUser} onPress={onLike} activeColor={colors.accent} label="Like" />
        <ActionButton icon={MessageCircle} count={formatCount(post.commentCount)} onPress={onOpenComments} label="Comment" />
        <ActionButton icon={Bookmark} active={post.isBookmarkedByUser} onPress={onBookmark} activeColor={colors.accent} label="Save" />
        <ActionButton icon={Share2} count={formatCount(post.shareCount)} onPress={onOpenShare} label="Share" />
        <TouchableOpacity onPress={() => setShowOverflow(true)} style={styles.actionBtn}>
          <View style={styles.actionIcon}><Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>•••</Text></View>
        </TouchableOpacity>
      </View>

      <OverflowMenu
        visible={showOverflow}
        onClose={() => setShowOverflow(false)}
          onBookmark={onBookmark}
          onAddToCollection={onAddToCollection}
          onRepost={onRepost}
          onReport={onReport}
          onEdit={post.userId === currentUserId ? onEdit : undefined}
          isBookmarked={post.isBookmarkedByUser}
        shareCount={post.shareCount}
        formatCount={formatCount}
        colors={colors}
        spacing={spacing}
        borderRadius={borderRadius}
        fontSize={fontSize}
        styles={{ actionBtn: styles.actionBtn, actionIcon: styles.actionIcon, actionCount: styles.actionCount }}
      />
    </View>
  );
});

function OverflowMenu({ visible, onClose, onBookmark, onAddToCollection, onRepost, onReport, onEdit, isBookmarked, shareCount, formatCount, colors, spacing, borderRadius, fontSize, styles }: any) {
  const iconColor = colors.text;
  const iconSize = 20;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
        <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 }} />
          <TouchableOpacity onPress={() => { onBookmark?.(); onClose(); }} style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }]}>
            <Bookmark size={iconSize} color={iconColor} fill={isBookmarked ? iconColor : 'none'} />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.md }}>{isBookmarked ? 'Remove Bookmark' : 'Save Post'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onAddToCollection?.(); onClose(); }} style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }]}>
            <FolderOpen size={iconSize} color={iconColor} />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.md }}>Add to Collection</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onRepost?.(); onClose(); }} style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }]}>
            <RefreshCw size={iconSize} color={iconColor} />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.md }}>Repost</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginLeft: 'auto' }}>{formatCount(shareCount)}</Text>
          </TouchableOpacity>
          {onEdit && (
            <TouchableOpacity onPress={() => { onEdit?.(); onClose(); }} style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }]}>
              <Edit2 size={iconSize} color={iconColor} />
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.md }}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => { onReport?.(); onClose(); }} style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }]}>
            <Text style={{ fontSize: 20, color: colors.danger }}>⚠</Text>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.md }}>Report</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    justifyContent: 'flex-end',
  },
  heartOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    pointerEvents: 'none',
  },
  mediaContainer: StyleSheet.absoluteFillObject,
  media: { width: '100%', height: '100%', resizeMode: 'cover' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
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
    zIndex: 25,
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
  timestamp: { color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: spacing.xs },
  whyBubble: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, alignSelf: 'flex-start', marginTop: 4 },
  whyBubbleText: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '500' },
  actionRail: {
    position: 'absolute',
    right: spacing.md,
    bottom: 100,
    zIndex: 30,
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
