import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { usePostStore } from '../../src/stores/postStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { api } from '../../src/api/client';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatCount } from '../../src/utils/format';
import { ArrowLeft, UserPlus, Check, Shield, MessageCircle, Send } from 'lucide-react-native';
import { mediumHaptic } from '../../src/utils/haptics';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { posts, followCreator, unfollowCreator, getUser } = usePostStore();
  const { currentUser, blockUser } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const u = await getUser(id);
    setUser(u);
    if (u) {
      const res = await api.users.posts(id, 1);
      setUserPosts(res.posts || []);
      setPostsTotal(res.total || 0);
      setPostsPage(1);
    }
    setLoading(false);
  }, [id, getUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const u = await getUser(id);
    setUser(u);
    if (u) {
      const res = await api.users.posts(id, 1);
      setUserPosts(res.posts || []);
      setPostsTotal(res.total || 0);
    }
    setRefreshing(false);
  }, [id, getUser]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const isFollowing = useMemo(() => user?.isFollowing ?? false, [user]);

  const handleFollow = useCallback(async () => {
    if (!currentUser) { router.push('/(auth)/welcome'); return; }
    if (user?.isFollowing) {
      await unfollowCreator(id);
    } else {
      await followCreator(id);
    }
    loadUser();
  }, [id, currentUser, user, followCreator, unfollowCreator, loadUser]);

  const handleBlock = useCallback(() => {
    if (!currentUser) { router.push('/(auth)/welcome'); return; }
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${user?.username}? They won't be able to interact with you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: async () => {
          try { await blockUser(id); } catch (e) { console.error(e); }
        }},
      ]
    );
  }, [id, currentUser, blockUser, user]);

  const handleMessage = useCallback(async () => {
    if (!currentUser) { router.push('/(auth)/welcome'); return; }
    try {
      const conv = await api.messages.createConversation(id);
      router.push(`/messages/${conv.id || id}`);
    } catch {
      router.push(`/messages/${id}`);
    }
  }, [currentUser, id]);

  const loadMorePosts = useCallback(async () => {
    if (postsLoading || userPosts.length >= postsTotal) return;
    setPostsLoading(true);
    try {
      const res = await api.users.posts(id, postsPage + 1);
      setUserPosts(prev => [...prev, ...(res.posts || [])]);
      setPostsPage(p => p + 1);
    } catch (e) { console.error(e); } finally {
      setPostsLoading(false);
    }
  }, [id, postsPage, postsTotal, postsLoading]);

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
        <Text style={s.topTitle}>@{user.username}</Text>
        <View style={{ width: 32 }} />
      </View>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 2 }}
        contentContainerStyle={{ gap: 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        onEndReached={loadMorePosts}
        ListHeaderComponent={
          <View style={s.profileSection}>
            <Avatar uri={user.avatarUrl} size={72} isVerified={user.isVerified} />
            <Text style={s.displayName}>{user.displayName}</Text>
            <Text style={s.username}>@{user.username}</Text>
            <Text style={s.bio}>{user.bio}</Text>
            <View style={s.statsRow}>
              <TouchableOpacity onPress={() => router.push(`/followers/${user.id}`)} style={s.statItem}>
                <Text style={s.statValue}>{formatCount(user.followerCount)}</Text><Text style={s.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/following/${user.id}`)} style={s.statItem}>
                <Text style={s.statValue}>{formatCount(user.followingCount)}</Text><Text style={s.statLabel}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.statItem}>
                <Text style={s.statValue}>{formatCount(postsTotal)}</Text><Text style={s.statLabel}>Posts</Text>
              </TouchableOpacity>
              <View style={s.statItem}>
                <Text style={s.statValue}>{formatCount(user.totalLikesReceived)}</Text><Text style={s.statLabel}>Likes</Text>
              </View>
            </View>
            {currentUser && currentUser.id !== id && (
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity onPress={handleFollow} style={[s.followBtn, isFollowing && s.followingBtn]}>
                  {isFollowing ? <Check size={16} color={colors.text} /> : <UserPlus size={16} color={colors.white} />}
                  <Text style={[s.followText, isFollowing && s.followingText]}>{isFollowing ? 'Following' : 'Follow'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleMessage} style={s.messageBtn}>
                  <Send size={14} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBlock} style={s.blockBtn}>
                  <Shield size={14} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm }}>Block</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)} style={s.gridItem}>
            <Image source={{ uri: item.coverThumbnailUrl }} style={s.gridImage} />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          postsLoading ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { padding: spacing.sm },
  topTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  profileSection: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  displayName: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg, marginTop: spacing.sm },
  username: { color: colors.textMuted, fontSize: fontSize.sm },
  bio: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: spacing.xl, paddingVertical: spacing.md },
  statItem: { alignItems: 'center' },
  statValue: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  followingBtn: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  followText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  followingText: { color: colors.text },
  messageBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  blockBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  gridItem: { flex: 1, aspectRatio: 3 / 4, backgroundColor: colors.bgCard },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});
