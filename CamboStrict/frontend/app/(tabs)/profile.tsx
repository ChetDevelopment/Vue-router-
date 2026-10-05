import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { router } from 'expo-router';
import { Bookmark, User, LogIn, UserPlus, X, Eye, Shield, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { usePostStore } from '../../src/stores/postStore';
import { api } from '../../src/api/client';
import { ProfileHeader } from '../../src/components/profile/ProfileHeader';
import { SettingsScreen } from '../../src/components/settings/SettingsScreen';
import { AdminPanel } from '../../src/components/admin/AdminPanel';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatCount } from '../../src/utils/format';

function GridImage({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return <View style={[styles.gridImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgCard }]}><Text style={{ fontSize: 20, opacity: 0.3 }}>📷</Text></View>;
  }
  return <Image source={{ uri }} style={styles.gridImage} onError={() => setFailed(true)} />;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, updateProfile, updateRole, logout, blockedUsers, unblockUser } = useAuthStore();
  const { posts, removePost, editPost, archivePost } = usePostStore();

  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'analytics'>('posts');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'likes' | 'comments' | 'followers'>('views');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userPostsPage, setUserPostsPage] = useState(1);
  const [userPostsTotal, setUserPostsTotal] = useState(0);
  const [userPostsLoading, setUserPostsLoading] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [profileRefreshing, setProfileRefreshing] = useState(false);

  const fetchUserPosts = useCallback(async (page = 1, append = false) => {
    if (!currentUser) return;
    setUserPostsLoading(true);
    try {
      const res = await api.users.posts(currentUser.id, page);
      const newPosts = res.posts || [];
      setUserPosts(append ? prev => [...prev, ...newPosts] : newPosts);
      setUserPostsTotal(res.total || 0);
      setUserPostsPage(page);
    } catch (e) { console.error(e); } finally {
      setUserPostsLoading(false);
    }
  }, [currentUser]);

  const fetchBookmarks = useCallback(async () => {
    if (!currentUser) return;
    setBookmarksLoading(true);
    try {
      const res = await api.posts.bookmarked();
      setBookmarkedPosts(res || []);
    } catch (e) { console.error(e); } finally {
      setBookmarksLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'posts') fetchUserPosts(1);
    if (activeTab === 'saved') fetchBookmarks();
  }, [activeTab, fetchUserPosts, fetchBookmarks]);

  useEffect(() => {
    if (activeTab === 'analytics' && currentUser?.isCreator) {
      setAnalyticsLoading(true);
      api.posts.analytics().then((res: any) => {
        setAnalyticsData(res?.analytics || []);
        setAnalyticsLoading(false);
      }).catch(() => setAnalyticsLoading(false));
    }
  }, [activeTab, currentUser?.isCreator]);

  const onProfileRefresh = useCallback(async () => {
    setProfileRefreshing(true);
    try {
      if (activeTab === 'posts') await fetchUserPosts(1);
      if (activeTab === 'saved') await fetchBookmarks();
    } catch (e) { console.error(e); } finally {
      setProfileRefreshing(false);
    }
  }, [activeTab, fetchUserPosts, fetchBookmarks]);

  if (!currentUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <View style={[styles.guestAvatar]}>
          <User size={40} color={colors.textMuted} />
        </View>
        <Text style={styles.guestTitle}>Join TokLok Cambodia</Text>
        <Text style={styles.guestSub}>Sign up to create your own profile, post, and follow creators</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/welcome')} style={styles.guestLoginBtn}>
          <LogIn size={16} color={colors.white} />
          <Text style={styles.guestLoginText}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(auth)/welcome')} style={styles.guestSignupBtn}>
          <UserPlus size={16} color={colors.white} />
          <Text style={styles.guestSignupText}>Create account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAdmin = currentUser.role === 'moderator' || currentUser.role === 'admin';
  const totalViews = userPosts.reduce((s, p) => s + (p.viewCount || 0), 0);
  const totalLikes = userPosts.reduce((s, p) => s + p.likeCount, 0);
  const totalComments = userPosts.reduce((s, p) => s + p.commentCount, 0);
  const totalShares = userPosts.reduce((s, p) => s + (p.shareCount || 0), 0);
  const displayPosts = activeTab === 'posts' ? userPosts : activeTab === 'saved' ? bookmarkedPosts : [];
  const isLoading = activeTab === 'posts' ? userPostsLoading : activeTab === 'saved' ? bookmarksLoading : false;

  const metricColors = { views: colors.accent, likes: colors.danger, comments: colors.blue, followers: colors.success };

  if (showAdmin && isAdmin) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <AdminPanel
          postCount={userPosts.length}
          onClose={() => setShowAdmin(false)}
        />
      </View>
    );
  }

  if (showSettings) {
    return <SettingsScreen onClose={() => setShowSettings(false)} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: spacing.xs }}
        contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.xxxl * 3 + spacing.xs }}
        refreshControl={<RefreshControl refreshing={profileRefreshing} onRefresh={onProfileRefresh} tintColor={colors.accent} />}
        onEndReached={() => {
          if (activeTab === 'posts' && userPosts.length < userPostsTotal && !userPostsLoading) {
            fetchUserPosts(userPostsPage + 1, true);
          }
        }}
        ListHeaderComponent={
          <View>
            <ProfileHeader
              user={currentUser}
              isOwnProfile={true}
              onSaveProfile={updateProfile}
              onToggleCreator={() => updateRole(currentUser.role === 'creator' ? 'user' : 'creator')}
              onOpenSettings={() => setShowSettings(true)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              postCount={userPostsTotal}
            />

            {isAdmin && (
              <TouchableOpacity onPress={() => setShowAdmin(true)} style={styles.adminBtn}>
                <Shield size={14} color={colors.accent} />
                <Text style={styles.adminBtnText}>Safety Queue</Text>
              </TouchableOpacity>
            )}

            {activeTab === 'analytics' && currentUser.isCreator && (
              <View style={{ padding: spacing.lg, gap: spacing.lg }}>
                {analyticsLoading ? (
                  <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.accent} />
                  </View>
                ) : (
                  <>
                    <View style={styles.scoreCard}>
                      <Text style={styles.scoreLabel}>Engagement Rate</Text>
                      <Text style={styles.scoreValue}>
                        {totalViews > 0
                          ? (((totalLikes + totalComments * 2 + totalShares * 3) / Math.max(1, totalViews)) * 100).toFixed(1)
                          : 'N/A'}
                      </Text>
                      <Text style={styles.scoreSub}>{userPostsTotal} posts · {formatCount(totalViews)} total views</Text>
                    </View>

                    <View style={styles.metricGrid}>
                      {(['views', 'likes', 'comments', 'followers'] as const).map((metric) => {
                        const isSel = selectedMetric === metric;
                        const color = metricColors[metric];
                        const dailyTotal = metric === 'followers'
                          ? currentUser.followerCount
                          : analyticsData.reduce((sum: number, d: any) => {
                              if (metric === 'views') return sum + (d.totalViews || 0);
                              if (metric === 'likes') return sum + (d.totalLikes || 0);
                              if (metric === 'comments') return sum + (d.totalComments || 0);
                              return sum;
                            }, 0);
                        return (
                          <TouchableOpacity key={metric} onPress={() => setSelectedMetric(metric)} style={[styles.metricCard, isSel && { borderColor: color, backgroundColor: color + '20' }]}>
                            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>{metric}</Text>
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md, marginTop: 4 }}>{formatCount(dailyTotal)}</Text>
                            <Text style={{ color: colors.success, fontSize: 9, fontWeight: '600' }}>{analyticsData.length > 0 ? 'Last 30 days' : `${userPostsTotal} posts`}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={{ height: 140, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.sm }}>
                      {analyticsData.length > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 100, paddingHorizontal: spacing.xs }}>
                          {analyticsData.map((d: any, i: number) => {
                            const val = selectedMetric === 'views' ? (d.totalViews || 0)
                              : selectedMetric === 'likes' ? (d.totalLikes || 0)
                              : selectedMetric === 'comments' ? (d.totalComments || 0) : 0;
                            const maxVal = Math.max(...analyticsData.map((x: any) =>
                              selectedMetric === 'views' ? (x.totalViews || 0)
                                : selectedMetric === 'likes' ? (x.totalLikes || 0)
                                : selectedMetric === 'comments' ? (x.totalComments || 0) : 0
                            ), 1);
                            return (
                              <TouchableOpacity key={i} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                                <Text style={{ color: colors.textMuted, fontSize: 6 }}>{val > 0 ? formatCount(val) : ''}</Text>
                                <View style={{ width: '100%', height: Math.max(4, (val / maxVal) * 80), backgroundColor: metricColors[selectedMetric], borderRadius: 2, opacity: 0.8 }} />
                                <Text style={{ color: colors.textMuted, fontSize: 6 }}>{d.date ? d.date.substring(8, 10) + '/' + d.date.substring(5, 7) : ''}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>Not enough data for chart</Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}

            {activeTab === 'saved' && bookmarkedPosts.length === 0 && !bookmarksLoading && (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Bookmark size={24} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>No saved posts yet.</Text>
              </View>
            )}

            {activeTab === 'posts' && userPosts.length === 0 && !userPostsLoading && (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted }}>No posts yet.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/create')} style={{ marginTop: spacing.md, backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.lg }}>
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.sm }}>Create your first post</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/post/${item.id}`)}
            onLongPress={() => {
              if (activeTab !== 'posts' || item.userId !== currentUser?.id) return;
              Alert.alert('Post options', undefined, [
                { text: 'Edit caption', onPress: () => { setEditPostId(item.id); setEditCaption(item.caption); } },
                { text: item.isArchived ? 'Unarchive' : 'Archive', onPress: () => archivePost(item.id) },
                { text: 'Delete', style: 'destructive', onPress: () => removePost(item.id) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            style={styles.gridItem}
          >
            <GridImage uri={item.coverThumbnailUrl} />
            <View style={styles.gridViewOverlay}>
              <Eye size={8} color={colors.white} />
              <Text style={styles.gridViewText}>{formatCount(item.viewCount || 0)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          activeTab === 'posts' && userPostsLoading && userPosts.length > 0 ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={editPostId !== null} transparent animationType="slide" onRequestClose={() => setEditPostId(null)}>
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <View style={styles.editHeader}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>Edit caption</Text>
              <TouchableOpacity onPress={() => setEditPostId(null)}><X size={16} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <TextInput value={editCaption} onChangeText={setEditCaption} style={styles.editField} placeholderTextColor={colors.textMuted} maxLength={150} />
            <TouchableOpacity
              onPress={async () => {
                if (!editCaption.trim() || !editPostId) return;
                try {
                  await editPost(editPostId, { caption: editCaption });
                  setEditPostId(null);
                } catch (e) { console.error(e); }
              }}
              style={styles.editSaveBtn}
            >
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.sm }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  guestTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.xl, marginBottom: spacing.sm, textAlign: 'center' },
  guestSub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 20, paddingHorizontal: spacing.xl },
  guestLoginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg, width: '100%', maxWidth: 280, marginBottom: spacing.md,
  },
  guestLoginText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  guestSignupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.lg,
    width: '100%', maxWidth: 280,
  },
  guestSignupText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: 'rgba(216,90,48,0.1)', borderWidth: 1, borderColor: 'rgba(216,90,48,0.3)',
    padding: spacing.sm, borderRadius: borderRadius.md, alignSelf: 'center', marginBottom: spacing.md,
  },
  adminBtnText: { color: colors.accent, fontWeight: '700', fontSize: fontSize.xs },
  gridItem: { flex: 1, aspectRatio: 3 / 4, backgroundColor: colors.bgCard, borderRadius: borderRadius.md, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gridViewOverlay: { position: 'absolute', top: spacing.xs, left: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.xs, paddingVertical: 1, borderRadius: borderRadius.sm },
  gridViewText: { color: colors.white, fontSize: 8, fontWeight: '600' },
  scoreCard: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing.lg },
  scoreLabel: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.xs, textTransform: 'uppercase' },
  scoreValue: { color: colors.text, fontWeight: '800', fontSize: 24, marginTop: spacing.xs },
  scoreSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { width: '47%', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md },
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: spacing.xl },
  editCard: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', maxWidth: 320, gap: spacing.md },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editField: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.sm, minHeight: 80, textAlignVertical: 'top' },
  editSaveBtn: { backgroundColor: colors.accent, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
});
