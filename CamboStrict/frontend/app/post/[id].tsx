import { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions, Share, Animated, PanResponder, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Heart, MessageCircle, Bookmark, Share2, Music, MapPin, Volume2, VolumeX, Info, ArrowLeft } from 'lucide-react-native';
import { lightHaptic, mediumHaptic } from '../../src/utils/haptics';
import { api } from '../../src/api/client';
import { usePostStore } from '../../src/stores/postStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { ActionButton } from '../../src/components/ui/ActionButton';
import { CommentSheet } from '../../src/components/comments/CommentSheet';
import { colors, borderRadius, fontSize, spacing, TAB_BAR_HEIGHT } from '../../src/constants/theme';
import { formatCount, formatRelativeTime } from '../../src/utils/format';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { posts, likePost, unlikePost, bookmarkPost, unbookmarkPost, followCreator, unfollowCreator } = usePostStore();
  const { currentUser } = useAuthStore();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const mediaLoadedRef = useRef(false);
  const [showCaption, setShowCaption] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const heartScale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const showHeartAnimation = useCallback(() => {
    heartScale.setValue(0.5);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.2, useNativeDriver: true, damping: 8, stiffness: 200 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 300 }),
    ]).start();
  }, [heartScale]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
    onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 120) Animated.timing(translateY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => router.back());
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    },
  })).current;

  const post = useMemo(() => posts.find((p) => p.id === id), [posts, id]);

  const mediaUrl = post?.mediaUrls?.[0] || post?.coverThumbnailUrl || '';
  const playerSource = Platform.OS !== 'web' && post?.type === 'video' && mediaUrl ? { uri: mediaUrl } : null;
  const player = useVideoPlayer(playerSource, (p: any) => { if (p) { p.loop = true; p.muted = true; } });

  const handleLike = useCallback(() => {
    if (!currentUser && post) { router.push('/(auth)/welcome'); return; }
    if (post) {
      lightHaptic();
      if (post.isLikedByUser) {
        unlikePost(post.id);
      } else {
        likePost(post.id);
      }
      showHeartAnimation();
    }
  }, [post, currentUser, likePost, unlikePost, showHeartAnimation]);

  const handleBookmark = useCallback(() => {
    if (!currentUser && post) { router.push('/(auth)/welcome'); return; }
    if (post) {
      lightHaptic();
      if (post.isBookmarkedByUser) {
        unbookmarkPost(post.id);
      } else {
        bookmarkPost(post.id);
      }
    }
  }, [post, currentUser, bookmarkPost, unbookmarkPost]);

  const handleShare = useCallback(async () => {
    if (!post) return;
    try { await Share.share({ message: `Check out this post on TokLok Cambodia: ${post.caption}`, url: `toklok://post/${post.id}` }); } catch (e) { console.error(e); }
  }, [post]);

  const handleSaveToGallery = useCallback(async () => {
    if (!post || Platform.OS === 'web') return;
    try {
      const MediaLibrary = await import('expo-media-library');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;
      await MediaLibrary.saveToLibraryAsync(post.mediaUrls[0]);
      alert('Saved to gallery');
    } catch (e) { console.error(e); }
  }, [post]);

  const handleCopyLink = useCallback(async () => {
    if (!post) return;
    const link = `toklok://post/${post.id}`;
    if (Platform.OS !== 'web') {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(link);
    }
    alert('Link copied');
  }, [post]);

  const handleFollow = useCallback(() => {
    if (!currentUser && post) { router.push('/(auth)/welcome'); return; }
    if (post) {
      mediumHaptic();
      if (post.isFollowingCreator) {
        unfollowCreator(post.userId);
      } else {
        followCreator(post.userId);
      }
    }
  }, [post, currentUser, followCreator, unfollowCreator]);

  // Double-tap for like
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMediaTap = useCallback(() => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      handleLike();
      showHeartAnimation();
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      togglePlay();
    }, 200);
  }, [handleLike, showHeartAnimation]);

  const togglePlay = useCallback(() => {
    if (!player) return;
    if (player.playing) player.pause();
    else player.play();
  }, [player]);

  const toggleMute = useCallback(() => {
    if (!player) return;
    setIsMuted((prev) => { const next = !prev; player.muted = next; return next; });
  }, [player]);

  if (!post) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md, padding: spacing.md }}>
          <Text style={{ color: colors.accent }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
      {/* Media — full screen like feed card */}
      {post.type === 'video' && Platform.OS !== 'web' ? (
        <TouchableOpacity activeOpacity={1} onPress={handleMediaTap} style={styles.mediaContainer}>
          <VideoView player={player!} style={styles.media} contentFit="cover" nativeControls={false} />
          {!mediaLoaded && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: mediaUrl }} style={styles.media} />
        </View>
      )}

      {/* Heart animation overlay */}
      <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }], opacity: heartScale.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}>
        <Heart size={64} color={colors.white} fill={colors.white} />
      </Animated.View>

      {/* Gradient overlay */}
      <View style={styles.gradient} />

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.roundBtn}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        {post.type === 'video' && (
          <TouchableOpacity onPress={toggleMute} style={styles.roundBtn}>
            {isMuted ? <VolumeX size={14} color={colors.white} /> : <Volume2 size={14} color={colors.white} />}
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom content — overlay on media like feed card */}
      <View style={styles.bottomContent}>
        <View style={styles.creatorRow}>
          <TouchableOpacity onPress={() => router.push(`/user/${post.userId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <Avatar uri={post.userAvatar} size={36} isVerified={post.isUserVerified} />
            <View>
              <Text style={styles.creatorName}>{post.userDisplayName}</Text>
              {post.locationTag && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <MapPin size={9} color={colors.accent} />
                  <Text style={styles.locationText}>{post.locationTag}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          {currentUser && currentUser.id !== post.userId && (
            <TouchableOpacity onPress={handleFollow} style={styles.followButton}>
              <Text style={styles.followText}>{post.isFollowingCreator ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => setShowCaption(!showCaption)}>
          <Text style={styles.caption} numberOfLines={showCaption ? undefined : 2}>{post.caption}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push(`/user/${post.userId}`)} style={styles.soundRow}>
          <Music size={11} color={colors.accent} />
          <Text style={styles.soundText} numberOfLines={1}>{post.soundName || `Original Audio - @${post.username}`}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
          <Info size={10} color="rgba(255,255,255,0.3)" />
          <Text style={styles.timestamp}>{formatCount(post.viewCount || 0)} views</Text>
        </View>
      </View>

      {/* Action rail — right side like feed card */}
      <View style={styles.actionRail}>
        <ActionButton icon={Heart} count={formatCount(post.likeCount)} active={post.isLikedByUser} onPress={handleLike} activeColor={colors.accent} label="Like" />
        <ActionButton icon={MessageCircle} count={formatCount(post.commentCount)} onPress={() => setShowComments(true)} label="Comment" />
        <ActionButton icon={Bookmark} active={post.isBookmarkedByUser} onPress={handleBookmark} activeColor={colors.accent} label="Bookmark" />
        <ActionButton icon={Share2} count={formatCount(post.shareCount)} onPress={() => setShowShareSheet(true)} label="Share" />
      </View>

      {/* Share sheet */}
      {showShareSheet && (
        <View style={styles.shareSheet}>
          <TouchableOpacity onPress={handleSaveToGallery} style={styles.shareSheetItem}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>💾</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Save to device</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopyLink} style={styles.shareSheetItem}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>🔗</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Copy link</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowShareSheet(false); router.push({ pathname: '/(tabs)/create', params: { duetPostId: post.id } }); }} style={styles.shareSheetItem}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>🎬</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Duet</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareSheetItem}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>📤</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Share</Text>
          </TouchableOpacity>
        </View>
      )}

      <CommentSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        currentUserAvatar={currentUser?.avatarUrl || ''}
        currentUserName={currentUser?.displayName || ''}
        currentUserId={currentUser?.id}
        onAddComment={async (postId, content, parentCommentId) => {
          try { await api.comments.add(postId, { content, parentCommentId }); } catch (e) { console.error(e); }
        }}
        onDeleteComment={async (postId, commentId) => {
          try { await api.comments.delete(postId, commentId); } catch (e) { console.error(e); }
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  mediaContainer: StyleSheet.absoluteFillObject,
  media: { width: '100%', height: '100%', resizeMode: 'cover' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.black },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 50, pointerEvents: 'none' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(0,0,0,0.5)' },
  topBar: { position: 'absolute', left: 0, right: 0, zIndex: 20, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  roundBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  bottomContent: { position: 'absolute', bottom: 30, left: spacing.md, right: 70, zIndex: 20, gap: spacing.sm },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  creatorName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  locationText: { color: colors.textMuted, fontSize: fontSize.xs },
  followButton: { backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  followText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  caption: { color: colors.text, fontSize: fontSize.sm, lineHeight: 18 },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  soundText: { color: colors.textMuted, fontSize: fontSize.xs, flex: 1 },
  timestamp: { color: 'rgba(255,255,255,0.35)', fontSize: 9 },
  actionRail: { position: 'absolute', right: spacing.md, bottom: 100, zIndex: 20, gap: spacing.lg, alignItems: 'center' },
  actionBtn: { alignItems: 'center', gap: 3 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  actionCount: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },
  shareSheet: { position: 'absolute', bottom: 40, right: spacing.md, backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.sm, zIndex: 30, borderWidth: 1, borderColor: colors.border, minWidth: 160 },
  shareSheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
});
