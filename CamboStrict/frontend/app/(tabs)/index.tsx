import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, useWindowDimensions, Share, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightHaptic, mediumHaptic } from '../../src/utils/haptics';
import { Sparkles, MapPin } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/authStore';
import { usePostStore } from '../../src/stores/postStore';
import { getCurrentPosition } from '../../src/utils/getLocation';
import { PostCard } from '../../src/components/feed/PostCard';
import { ReportSheet } from '../../src/components/feed/ReportSheet';
import { CommentSheet } from '../../src/components/comments/CommentSheet';
import { SoundDetailSheet } from '../../src/components/sound/SoundDetailSheet';
import { Toast } from '../../src/components/ui/Toast';
import { colors, fontSize, spacing, borderRadius, TAB_BAR_HEIGHT } from '../../src/constants/theme';

export default function FeedScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const itemHeight = useMemo(() => windowHeight - TAB_BAR_HEIGHT, [windowHeight]);
  const {
    posts, feedType, setFeedType, error,
    likePost, unlikePost, bookmarkPost, unbookmarkPost,
    followCreator, unfollowCreator, repostPost,
    fetchPosts,
  } = usePostStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(1);
  const hasMore = usePostStore((s) => s.hasMore);
  const isLoading = usePostStore((s) => s.isLoading);
  const [nearbyPosts, setNearbyPosts] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => { setPage(1); }, [feedType]);
  useEffect(() => { fetchPosts(page, feedType); }, [fetchPosts, page, feedType]);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setNearbyLoading(true);
    setNearbyCoords({ lat, lng });
    try {
      const res = await api.posts.nearby(lat, lng);
      setNearbyPosts(res?.data ?? []);
    } catch { setNearbyPosts([]); }
    setNearbyLoading(false);
  }, []);

  useEffect(() => {
    if (feedType !== 'nearby') return;
    let cancelled = false;
    (async () => {
      const coords = await getCurrentPosition();
      if (!cancelled) {
        if (coords) {
          fetchNearby(coords.lat, coords.lng);
        } else {
          setNearbyPosts([]);
          setNearbyLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [feedType, fetchNearby]);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [soundDetailId, setSoundDetailId] = useState<string | null>(null);
  const [showReportForPost, setShowReportForPost] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setPage(1);
    setRefreshing(true);
    fetchPosts(1, feedType).finally(() => setRefreshing(false));
  }, [fetchPosts, feedType]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastType(type);
    toastTimer.current = setTimeout(() => { setToastMessage(null); toastTimer.current = null; }, 2500);
  }, []);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  // Festival countdown banner
  const festivalBanner = useMemo(() => {
    const now = new Date();
    const festivals = [
      { name: 'Khmer New Year', emoji: '🎊', month: 4, day: 13 },
      { name: 'Pchum Ben', emoji: '🙏', month: 9, day: 20 },
      { name: 'Water Festival', emoji: '🚣', month: 11, day: 5 },
      { name: 'Independence Day', emoji: '🇰🇭', month: 11, day: 9 },
    ];
    for (const f of festivals) {
      const target = new Date(now.getFullYear(), f.month - 1, f.day);
      if (now > target) target.setFullYear(target.getFullYear() + 1);
      const diff = Math.ceil((target.getTime() - now.getTime()) / 86400000);
      if (diff >= 0 && diff <= 14) return { ...f, daysLeft: diff };
    }
    return null;
  }, []);

  const displayPosts = feedType === 'nearby' ? nearbyPosts : posts;

  const handleLike = useCallback((postId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Guest mode: Please sign up to like posts!', 'error');
      return;
    }
    const post = posts.find(p => p.id === postId);
    lightHaptic();
    if (post?.isLikedByUser) {
      unlikePost(postId);
    } else {
      likePost(postId);
    }
  }, [currentUser, likePost, unlikePost, posts, showToast]);

  const handleBookmark = useCallback((postId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Guest mode: Please sign up to bookmark posts!', 'error');
      return;
    }
    const post = posts.find(p => p.id === postId);
    lightHaptic();
    if (post?.isBookmarkedByUser) {
      unbookmarkPost(postId);
    } else {
      bookmarkPost(postId);
    }
  }, [currentUser, bookmarkPost, unbookmarkPost, posts, showToast]);

  const handleFollow = useCallback((creatorId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Guest mode: Please sign up to follow creators!', 'error');
      return;
    }
    const post = posts.find(p => p.userId === creatorId);
    mediumHaptic();
    if (post?.isFollowingCreator) {
      unfollowCreator(creatorId);
    } else {
      followCreator(creatorId);
    }
    showToast('Follow status updated!', 'success');
  }, [currentUser, followCreator, unfollowCreator, posts, showToast]);

  const handleRepost = useCallback(async (postId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Sign up to repost!', 'error');
      return;
    }
    try {
      await repostPost(postId);
      showToast('Reposted!', 'success');
    } catch {
      showToast('Failed to repost', 'error');
    }
  }, [currentUser, repostPost, showToast]);

  const handleAddToCollection = useCallback(async (postId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Sign up to save posts!', 'error');
      return;
    }
    try {
      const collections = await api.collections.list();
      if (collections.length === 0) {
        const col = await api.collections.create('Saved Posts', '📁');
        await api.collections.addPost(col.id, postId);
      } else {
        await api.collections.addPost(collections[0].id, postId);
      }
      showToast('Saved to collection!', 'success');
    } catch {
      showToast('Failed to save', 'error');
    }
  }, [showToast]);

  const handleShare = useCallback(async (postId: string, caption: string) => {
    try {
      await Share.share({
        message: `Check out this post on TokLok Cambodia: ${caption}`,
        url: `toklok://post/${postId}`,
      });
    } catch (e) { console.error(e); }
  }, []);

  const handleAddComment = useCallback(async (postId: string, content: string, parentCommentId: string | null) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Sign up to comment!', 'error');
      return;
    }
    try {
      await api.comments.add(postId, { content, parentCommentId });
      showToast('Comment published!', 'success');
    } catch {
      showToast('Failed to post comment', 'error');
    }
  }, [currentUser, showToast]);

  const handleReport = useCallback(async (reason: string) => {
    if (!currentUser || !reportPostId) return;
    try {
      await api.reports.create({ targetType: 'post', targetId: reportPostId, reason });
      setReportPostId(null);
      showToast('Post flagged for moderation.', 'success');
    } catch {
      showToast('Failed to submit report', 'error');
    }
  }, [currentUser, reportPostId, showToast]);

  const onViewableItemsChangedCallback = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null; item: any }> }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index ?? 0;
        setActiveIndex(index);
      }
    },
    []
  );

  const renderPost = useCallback(({ item, index }: { item: any; index: number }) => (
    <PostCard
      post={item}
      isActive={index === activeIndex}
      onLike={() => handleLike(item.id)}
      onBookmark={() => handleBookmark(item.id)}
      onAddToCollection={() => handleAddToCollection(item.id)}
      onRepost={() => handleRepost(item.id)}
      onFollow={() => handleFollow(item.userId)}
      onOpenComments={() => setCommentsPostId(item.id)}
      onOpenShare={() => handleShare(item.id, item.caption)}
      onUseSound={() => setSoundDetailId(item.soundId || null)}
      onReport={() => setShowReportForPost(item.id)}
      onEdit={item.userId === currentUser?.id ? () => router.push('/(tabs)/profile') : undefined}
      currentUserId={currentUser?.id}
    />
  ), [activeIndex, handleLike, handleBookmark, handleAddToCollection, handleRepost, handleFollow, handleShare, currentUser?.id]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore]);

  return (
    <View style={styles.container}>
      {(feedType === 'nearby' ? nearbyLoading : isLoading) && displayPosts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
      <>
      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? null : error ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedTitle}>Something went wrong</Text>
              <Text style={styles.emptyFeedSub}>{error}</Text>
              <TouchableOpacity onPress={() => fetchPosts(1, feedType)} style={styles.discoverBtn}>
                <Text style={styles.discoverBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : feedType === 'following' ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedTitle}>No posts yet</Text>
              <Text style={styles.emptyFeedSub}>Follow creators to see their posts here</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} style={styles.discoverBtn}>
                <Text style={styles.discoverBtnText}>Discover creators</Text>
              </TouchableOpacity>
            </View>
          ) : feedType === 'nearby' ? (
            <View style={styles.emptyFeed}>
              <MapPin size={40} color={colors.textMuted} />
              <Text style={styles.emptyFeedTitle}>No nearby posts</Text>
              <Text style={styles.emptyFeedSub}>{nearbyCoords ? 'No one has posted nearby yet' : 'Enable location to see nearby posts'}</Text>
              {!nearbyCoords && (
                <TouchableOpacity onPress={() => setFeedType('explore')} style={styles.discoverBtn}>
                  <Text style={styles.discoverBtnText}>Browse For You</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedTitle}>Welcome to TokLok!</Text>
              <Text style={styles.emptyFeedSub}>Follow creators or explore trending content to get started</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} style={styles.discoverBtn}>
                <Text style={styles.discoverBtnText}>Explore</Text>
              </TouchableOpacity>
              {!currentUser && (
                <TouchableOpacity onPress={() => router.push('/(auth)/welcome')} style={[styles.discoverBtn, { marginTop: spacing.sm, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={[styles.discoverBtnText, { color: colors.text }]}>Sign up</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        renderItem={renderPost}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChangedCallback}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={2}
        ListFooterComponent={
          (feedType === 'nearby' ? nearbyLoading : isLoading) && displayPosts.length > 0 ? (
            <View style={{ height: TAB_BAR_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
      />
      </>
      )}

      <View style={[styles.feedHeader, { paddingTop: insets.top }]}>
        <TouchableOpacity accessibilityRole="tab" accessibilityLabel="For You feed" onPress={() => setFeedType('explore')} style={feedType === 'explore' ? styles.feedTabActive : styles.feedTab}>
          <Text style={[styles.feedTabText, feedType === 'explore' && styles.feedTabTextActive]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="tab" accessibilityLabel="Following feed" onPress={() => setFeedType('following')} style={feedType === 'following' ? styles.feedTabActive : styles.feedTab}>
          <Text style={[styles.feedTabText, feedType === 'following' && styles.feedTabTextActive]}>Following</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="tab" accessibilityLabel="Nearby feed" onPress={() => setFeedType('nearby')} style={feedType === 'nearby' ? styles.feedTabActive : styles.feedTab}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={14} color={feedType === 'nearby' ? colors.text : colors.textMuted} />
            <Text style={[styles.feedTabText, feedType === 'nearby' && styles.feedTabTextActive]}>Nearby</Text>
          </View>
        </TouchableOpacity>
      </View>

      {festivalBanner && (
        <TouchableOpacity onPress={() => router.push('/leaderboard')} style={[styles.festivalBanner, { top: insets.top + 46 }]}>
          <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{festivalBanner.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.sm }}>
              {festivalBanner.name} in {festivalBanner.daysLeft} day{festivalBanner.daysLeft > 1 ? 's' : ''}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: fontSize.xs }}>Join the celebration!</Text>
          </View>
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: fontSize.sm }}>Explore</Text>
        </TouchableOpacity>
      )}

      <CommentSheet
        isOpen={commentsPostId !== null}
        onClose={() => setCommentsPostId(null)}
        postId={commentsPostId || ''}
        currentUserAvatar={currentUser?.avatarUrl || ''}
        currentUserName={currentUser?.displayName || ''}
        currentUserId={currentUser?.id}
        onAddComment={handleAddComment}
        onDeleteComment={async (postId, commentId) => {
          try {
            await api.comments.delete(postId, commentId);
            showToast('Comment deleted', 'success');
          } catch { showToast('Failed to delete', 'error'); }
        }}
      />

      <SoundDetailSheet
        soundId={soundDetailId}
        visible={soundDetailId !== null}
        onClose={() => setSoundDetailId(null)}
      />
      <ReportSheet
        visible={showReportForPost !== null}
        onClose={() => setShowReportForPost(null)}
        onSubmit={(reason) => handleReport(reason)}
      />
      <Toast message={toastMessage} type={toastType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyFeed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: spacing.xl,
  },
  emptyFeedTitle: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.md, marginBottom: spacing.sm },
  emptyFeedSub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  discoverBtn: { marginTop: spacing.lg, backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  discoverBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  feedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 40,
  },
  feedTab: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  feedTabActive: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  feedTabText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.md },
  feedTabTextActive: { color: colors.text },
  festivalBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard,
    padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
    zIndex: 40,
  },
});
