import { useState, useRef, useCallback } from 'react';
import { View, FlatList, Dimensions, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { usePostStore } from '../../src/stores/postStore';
import { PostCard } from '../../src/components/feed/PostCard';
import { CommentSheet } from '../../src/components/comments/CommentSheet';
import { Toast } from '../../src/components/ui/Toast';
import { colors, fontSize } from '../../src/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, blockUser } = useAuthStore();
  const {
    posts, feedType, setFeedType,
    likePost, bookmarkPost, followCreator,
    comments, addComment, likeComment,
    addNotification,
  } = usePostStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredPosts = posts.filter((p) => feedType === 'following' ? p.isFollowingCreator || p.userId === currentUser?.id : true);

  const handleLike = useCallback((postId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Guest mode: Please sign up to like posts!');
      return;
    }
    likePost(postId);
  }, [currentUser, likePost]);

  const handleBookmark = useCallback((postId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Guest mode: Please sign up to bookmark posts!');
      return;
    }
    bookmarkPost(postId);
  }, [currentUser, bookmarkPost]);

  const handleFollow = useCallback((creatorId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      showToast('Guest mode: Please sign up to follow creators!');
      return;
    }
    followCreator(creatorId, false);
    showToast('Follow status updated!');
  }, [currentUser, followCreator]);

  const handleAddComment = (postId: string, content: string, parentCommentId: string | null) => {
    if (!currentUser) return;
    const newComment = {
      id: `comm_${Math.random()}`,
      postId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatarUrl,
      userDisplayName: currentUser.displayName,
      content,
      likeCount: 0,
      createdAt: new Date().toISOString(),
      isLikedByUser: false,
      parentCommentId,
      replies: [],
    };
    addComment(postId, newComment, false);
    showToast('Comment published!');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const handleReport = (reason: string) => {
    if (!currentUser || !reportPostId) return;
    const post = posts.find((p) => p.id === reportPostId);
    if (!post) return;
    addNotification({
      id: `rep_${Math.random()}`,
      reporterId: currentUser.id,
      reporterUsername: currentUser.username,
      targetType: 'post',
      targetId: reportPostId,
      targetExcerpt: post.caption,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    } as any);
    setReportPostId(null);
    showToast('Post flagged for moderation.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.feedHeader}>
        <TouchableOpacity onPress={() => setFeedType('explore')} style={feedType === 'explore' && styles.feedTabActive}>
          <Text style={[styles.feedTab, feedType === 'explore' && styles.feedTabTextActive]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFeedType('following')} style={feedType === 'following' && styles.feedTabActive}>
          <Text style={[styles.feedTab, feedType === 'following' && styles.feedTabTextActive]}>Following</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PostCard
            post={item}
            isActive={index === activeIndex}
            onLike={() => handleLike(item.id)}
            onBookmark={() => handleBookmark(item.id)}
            onFollow={() => handleFollow(item.userId)}
            onOpenComments={() => setCommentsPostId(item.id)}
            onOpenShare={() => setSharePostId(item.id)}
            onOpenReport={() => setReportPostId(item.id)}
            onRemix={() => {}}
            onUseSound={() => {}}
            currentUserId={currentUser?.id}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT - 60}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={{ flex: 1 }}
      />

      <CommentSheet
        isOpen={commentsPostId !== null}
        onClose={() => setCommentsPostId(null)}
        postId={commentsPostId || ''}
        comments={comments.filter((c) => c.postId === commentsPostId)}
        currentUserAvatar={currentUser?.avatarUrl || ''}
        currentUserName={currentUser?.displayName || ''}
        onAddComment={handleAddComment}
        onLikeComment={likeComment}
      />

      <Toast message={toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
    zIndex: 30,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
  },
  feedTab: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.md },
  feedTabActive: {},
  feedTabTextActive: { color: colors.text },
});
