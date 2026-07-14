import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Bookmark, ArrowLeft, ChevronRight, BarChart2, Eye, Heart, MessageSquare, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { usePostStore } from '../../src/stores/postStore';
import { ProfileHeader } from '../../src/components/profile/ProfileHeader';
import { GiftingModal } from '../../src/components/gifting/GiftingModal';
import { AdminPanel } from '../../src/components/admin/AdminPanel';
import { MOCK_ANALYTICS } from '../../src/constants/data';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatCount } from '../../src/utils/format';

const SVGLineChart = ({ data, strokeColor = '#D85A30' }: { data: { date: string; value: number }[]; strokeColor?: string }) => (
  <View style={{ height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, borderRadius: borderRadius.lg, padding: spacing.sm }}>
    <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{data.map(d => d.value).join(' • ')}</Text>
    <View style={{ flexDirection: 'row', gap: 2, marginTop: spacing.sm }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <View style={{ height: Math.max(4, (d.value / Math.max(...data.map(x => x.value))) * 60), width: 6, backgroundColor: strokeColor, borderRadius: 3 }} />
          <Text style={{ color: colors.textMuted, fontSize: 6 }}>{d.date}</Text>
        </View>
      ))}
    </View>
  </View>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, updateProfile, updateRole, logout, blockedUsernames, unblockUser } = useAuthStore();
  const { posts, reports, actionReport, publishPost } = usePostStore();

  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'analytics'>('posts');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'likes' | 'comments' | 'followers'>('views');
  const [giftingCreator, setGiftingCreator] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  if (!currentUser) return null;

  const ownPosts = posts.filter((p) => p.userId === currentUser.id);
  const bookmarkedPosts = posts.filter((p) => p.isBookmarkedByUser);
  const isAdmin = currentUser.role === 'moderator' || currentUser.role === 'admin';

  const metricData = {
    views: MOCK_ANALYTICS.viewsOverTime,
    likes: MOCK_ANALYTICS.likesOverTime,
    comments: MOCK_ANALYTICS.commentsOverTime,
    followers: MOCK_ANALYTICS.followersGrowth,
  };
  const metricColors = { views: colors.accent, likes: colors.danger, comments: colors.blue, followers: colors.success };

  if (showAdmin && isAdmin) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <AdminPanel
          reports={reports}
          postCount={posts.length}
          onActionReport={actionReport}
          onClose={() => setShowAdmin(false)}
        />
      </View>
    );
  }

  if (showSettings) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.settingsHeader}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>Settings</Text>
          <TouchableOpacity onPress={() => setShowSettings(false)}><Text style={{ color: colors.accent, fontWeight: '700', fontSize: fontSize.sm }}>Done</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
          <TouchableOpacity onPress={() => updateProfile({ isPrivate: !currentUser.isPrivate })} style={styles.settingRow}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.sm }}>Private Account</Text>
            <View style={[styles.toggle, currentUser.isPrivate && styles.toggleOn]}>
              <View style={[styles.toggleDot, currentUser.isPrivate && styles.toggleDotOn]} />
            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.settingsSectionTitle}>Blocked Users</Text>
            {blockedUsernames.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>No blocked users.</Text>
            ) : (
              blockedUsernames.map((name) => (
                <View key={name} style={styles.blockedRow}>
                  <Text style={{ color: colors.text }}>@{name}</Text>
                  <TouchableOpacity onPress={() => unblockUser(name)}>
                    <Text style={{ color: colors.danger, fontWeight: '600', fontSize: fontSize.sm }}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity onPress={() => updateRole(currentUser.role === 'creator' ? 'user' : 'creator')} style={styles.settingRow}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.sm }}>Creator Mode: {currentUser.isCreator ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { logout(); }} style={[styles.settingRow, { borderColor: colors.danger }]}>
            <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fontSize.sm }}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={activeTab === 'posts' ? ownPosts : activeTab === 'saved' ? bookmarkedPosts : []}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 4 }}
        contentContainerStyle={{ gap: 4, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <ProfileHeader
              user={currentUser}
              isOwnProfile={true}
              onSaveProfile={updateProfile}
              onToggleCreator={() => updateRole(currentUser.role === 'creator' ? 'user' : 'creator')}
              onOpenSettings={() => setShowSettings(true)}
              onSupportCreator={(user: any) => setGiftingCreator(user)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              postCount={ownPosts.length}
            />

            {isAdmin && (
              <TouchableOpacity onPress={() => setShowAdmin(true)} style={styles.adminBtn}>
                <Text style={styles.adminBtnText}>Safety Queue ({reports.length})</Text>
              </TouchableOpacity>
            )}

            {activeTab === 'analytics' && currentUser.isCreator && (
              <View style={{ padding: spacing.lg, gap: spacing.lg }}>
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Creator Score</Text>
                  <Text style={styles.scoreValue}>94.8</Text>
                  <Text style={styles.scoreSub}>Top 5% of Cambodian creators</Text>
                </View>

                <View style={styles.metricGrid}>
                  {(['views', 'likes', 'comments', 'followers'] as const).map((metric) => {
                    const isSel = selectedMetric === metric;
                    const color = metricColors[metric];
                    return (
                      <TouchableOpacity key={metric} onPress={() => setSelectedMetric(metric)} style={[styles.metricCard, isSel && { borderColor: color, backgroundColor: color + '20' }]}>
                        <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>{metric}</Text>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md, marginTop: 4 }}>{formatCount(metricData[metric][6].value)}</Text>
                        <Text style={{ color: colors.success, fontSize: 9, fontWeight: '600' }}>↑ +{Math.floor(Math.random() * 30)}%</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <SVGLineChart data={metricData[selectedMetric]} strokeColor={metricColors[selectedMetric]} />
              </View>
            )}

            {activeTab === 'saved' && bookmarkedPosts.length === 0 && (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Bookmark size={24} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>No saved posts yet.</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridItem}>
            <Image source={{ uri: item.coverThumbnailUrl }} style={styles.gridImage} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={activeTab === 'posts' && ownPosts.length === 0 ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted }}>No posts yet.</Text>
          </View>
        ) : null}
        showsVerticalScrollIndicator={false}
      />

      <GiftingModal
        creator={giftingCreator || currentUser}
        visible={giftingCreator !== null}
        onClose={() => setGiftingCreator(null)}
        onSuccess={(amount, provider) => {
          setGiftingCreator(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsSectionTitle: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.xs, textTransform: 'uppercase', marginBottom: spacing.sm },
  blockedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.bgCard, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  toggle: { width: 40, height: 22, borderRadius: 11, backgroundColor: colors.bgLight, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: colors.accent },
  toggleDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.textMuted },
  toggleDotOn: { backgroundColor: colors.white, transform: [{ translateX: 18 }] },
  adminBtn: { backgroundColor: colors.danger, padding: spacing.sm, borderRadius: borderRadius.md, alignSelf: 'center', marginBottom: spacing.md },
  adminBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.xs },
  gridItem: { flex: 1, aspectRatio: 3 / 4, backgroundColor: colors.bgCard, borderRadius: borderRadius.md, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  scoreCard: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing.lg },
  scoreLabel: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.xs, textTransform: 'uppercase' },
  scoreValue: { color: colors.text, fontWeight: '800', fontSize: 24, marginTop: spacing.xs },
  scoreSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { width: '47%', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md },
});
