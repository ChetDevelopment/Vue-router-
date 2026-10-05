import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Hash, Users, Flame, MapPin, Trophy, ChevronRight, UserPlus, Check } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { usePostStore } from '../../src/stores/postStore';
import { useAuthStore } from '../../src/stores/authStore';
import { SearchBar } from '../../src/components/explore/SearchBar';
import { UserListItem } from '../../src/components/ui/UserListItem';
import { PostGridCard } from '../../src/components/ui/PostGridCard';
import { Toast } from '../../src/components/ui/Toast';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatCount } from '../../src/utils/format';

export default function ExploreScreen() {
  const { width: screenW } = useWindowDimensions();
  const CARD_W = useMemo(() => (screenW - 48) / 2, [screenW]);
  const insets = useSafeAreaInsets();
  const { fetchTrendingHashtags, trendingHashtags, fetchSuggestedUsers } = usePostStore();
  const { currentUser, blockUser } = useAuthStore();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [soundResults, setSoundResults] = useState<any[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  // Explore feed state (dedicated endpoint)
  const [explorePosts, setExplorePosts] = useState<any[]>([]);
  const [explorePage, setExplorePage] = useState(1);
  const [exploreTotal, setExploreTotal] = useState(0);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [creators, setCreators] = useState<any[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Track follow state for creator cards
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());

  const showToast = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'hashtags' | 'creators' | 'nearby'>('trending');
  const [refreshing, setRefreshing] = useState(false);

  const fetchExplore = useCallback(async (page: number, append = false) => {
    setExploreLoading(true);
    try {
      const res = await api.posts.explore(page);
      const newPosts = res?.posts || [];
      setExplorePosts(append ? prev => [...prev, ...newPosts] : newPosts);
      setExploreTotal(res?.total || 0);
      setExplorePage(page);
    } catch (e) { console.error(e); } finally {
      setExploreLoading(false);
    }
  }, []);

  useEffect(() => { fetchExplore(1); fetchTrendingHashtags(); }, [fetchTrendingHashtags]);
  useEffect(() => {
    setCreatorsLoading(true);
    fetchSuggestedUsers().then(u => { setCreators(u || []); setCreatorsLoading(false); }).catch(() => setCreatorsLoading(false));
  }, [fetchSuggestedUsers]);

  useEffect(() => {
    if (activeTab !== 'nearby') return;
    setNearbyLoading(true);
    api.posts.nearby(11.5564, 104.9282, 50)
      .then(setNearbyPosts)
      .catch(() => {})
      .finally(() => setNearbyLoading(false));
  }, [activeTab]);

  useEffect(() => {
    api.search.trending().then(r => setTrendingSearches(r?.trending || [])).catch(() => {});
    if (currentUser) {
      api.search.history().then(r => setSearchHistory(r?.history || [])).catch(() => {});
    }
  }, [currentUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchExplore(1),
      fetchTrendingHashtags(),
      fetchSuggestedUsers().then(setCreators).catch(() => {}),
    ]);
    setRefreshing(false);
  }, [fetchExplore, fetchTrendingHashtags, fetchSuggestedUsers]);

  // Search with debounce — includes sound results
  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); setUserResults([]); setHashtagResults([]); setSoundResults([]); setSearchError(false); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(false);
      try {
        const res = await api.search.all(searchQuery);
        if (!cancelled) {
          setSearchResults(res?.posts || []);
          setUserResults(res?.users || []);
          setHashtagResults(res?.hashtags || []);
          setSoundResults(res?.sounds || []);
        }
      } catch {
        if (!cancelled) setSearchError(true);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);
    return () => { clearTimeout(timer); cancelled = true; };
  }, [searchQuery]);

  const handleFollow = useCallback(async (userId: string) => {
    if (!currentUser) { router.push('/(auth)/welcome'); return; }
    try {
      await api.users.follow(userId);
      setFollowedCreators(prev => new Set(prev).add(userId));
      showToast('Followed!', 'success');
    } catch {
      showToast('Failed to follow', 'error');
    }
  }, [currentUser, showToast]);

  const handleUnfollow = useCallback(async (userId: string) => {
    try {
      await api.users.unfollow(userId);
      setFollowedCreators(prev => { const n = new Set(prev); n.delete(userId); return n; });
      showToast('Unfollowed', 'info');
    } catch {
      showToast('Failed to unfollow', 'error');
    }
  }, [showToast]);

  const isGrid = activeTab === 'trending' || activeTab === 'nearby' || !!searchQuery;

  const renderPostGrid = useCallback(({ item: post }: { item: any }) => (
    <PostGridCard post={post} width={CARD_W} />
  ), [CARD_W]);

  const renderHashtag = useCallback(({ item: ht }: any) => (
    <TouchableOpacity onPress={() => router.push(`/hashtag/${ht.tag}`)} style={styles.hashCard}>
      <View style={styles.hashIcon}><Hash size={16} color={colors.accent} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.hashName}>#{ht.tag}</Text>
        <Text style={styles.hashCount}>{formatCount(ht.postCount)} posts</Text>
      </View>
      <ChevronRight size={14} color={colors.textMuted} />
    </TouchableOpacity>
  ), []);

  const renderCreator = useCallback(({ item: creator }: any) => {
    const isFollowed = followedCreators.has(creator.id);
    return (
      <UserListItem
        id={creator.id}
        username={creator.username}
        displayName={creator.displayName}
        avatarUrl={creator.avatarUrl}
        isVerified={creator.isVerified}
        bio={creator.bio}
        rightAction={
          currentUser && currentUser.id !== creator.id ? (
            <TouchableOpacity
              onPress={() => isFollowed ? handleUnfollow(creator.id) : handleFollow(creator.id)}
              style={[styles.followChip, isFollowed && styles.followChipActive]}
            >
              {isFollowed ? (
                <Check size={12} color={colors.text} />
              ) : (
                <UserPlus size={12} color={colors.white} />
              )}
              <Text style={[styles.followChipText, isFollowed && { color: colors.text }]}>
                {isFollowed ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    );
  }, [currentUser, followedCreators, handleFollow, handleUnfollow]);

  const listData = useMemo(() => {
    if (searchQuery) {
      const items: any[] = [];
      if (userResults.length > 0) { items.push({ type: 'section', label: `People (${userResults.length})` }); items.push(...userResults.map((u: any) => ({ ...u, _isUser: true }))); }
      if (hashtagResults.length > 0) { items.push({ type: 'section', label: `Hashtags (${hashtagResults.length})` }); items.push(...hashtagResults.map((h: any) => ({ ...h, _isHashtag: true }))); }
      if (soundResults.length > 0) { items.push({ type: 'section', label: `Sounds (${soundResults.length})` }); items.push(...soundResults.map((s: any) => ({ ...s, _isSound: true, id: s.id }))); }
      if (searchResults.length > 0) { items.push({ type: 'section', label: `Posts (${searchResults.length})` }); items.push(...searchResults.map((p: any) => ({ ...p, _isUser: false }))); }
      return items;
    }
    if (activeTab === 'trending') return explorePosts;
    if (activeTab === 'nearby') return nearbyPosts;
    if (activeTab === 'hashtags') return trendingHashtags;
    return creators;
  }, [searchQuery, activeTab, searchResults, userResults, hashtagResults, soundResults, nearbyPosts, explorePosts, trendingHashtags, creators]);

  const handleLoadMore = useCallback(() => {
    if (activeTab === 'trending' && !exploreLoading && explorePosts.length < exploreTotal) {
      fetchExplore(explorePage + 1, true);
    }
  }, [activeTab, exploreLoading, explorePosts.length, exploreTotal, explorePage, fetchExplore]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {!searchQuery && (
        <>
          {trendingSearches.length > 0 && (
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', marginBottom: spacing.xs }}>Trending Searches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {trendingSearches.map((ts: any) => (
                  <TouchableOpacity key={ts.term} onPress={() => setSearchQuery(ts.term)} style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.xs }}>{ts.term}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {searchHistory.length > 0 && (
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', marginBottom: spacing.xs }}>Recent Searches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {searchHistory.slice(0, 10).map((sh: any) => (
                  <TouchableOpacity key={sh.id} onPress={() => setSearchQuery(sh.query)} style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md }}>
                    <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: fontSize.xs }}>{sh.query}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
          {[
            { key: 'trending' as const, icon: Flame, label: 'Trending' },
            { key: 'nearby' as const, icon: MapPin, label: 'Nearby' },
            { key: 'hashtags' as const, icon: Hash, label: 'Hashtags' },
            { key: 'creators' as const, icon: Users, label: 'Creators' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
              >
                <Icon size={12} color={isActive ? colors.white : colors.textMuted} />
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        </>
      )}

      <FlatList
        key={isGrid ? 'grid' : 'list'}
        data={listData}
        keyExtractor={(item: any) => item.type === 'section' ? `section-${item.label}` : item.id}
        numColumns={isGrid ? 2 : 1}
        columnWrapperStyle={isGrid ? { gap: spacing.sm } : undefined}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl * 3 + spacing.md }}
        ListHeaderComponent={
          (activeTab === 'nearby' && nearbyLoading) ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm }}>Finding nearby posts...</Text>
            </View>
          ) : (activeTab === 'creators' && creatorsLoading) ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : (isSearching && searchQuery) ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm }}>Searching...</Text>
            </View>
          ) : null
        }
        renderItem={({ item }: { item: any }) => {
          if (item.type === 'section') {
            return <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm, paddingVertical: spacing.sm }}>{item.label}</Text>;
          }
          if (searchQuery) {
            if (item._isHashtag) return renderHashtag({ item });
            if (item._isSound) {
              return (
                <TouchableOpacity onPress={() => router.push(`/hashtag/${item.id}`)} style={styles.hashCard}>
                  <View style={[styles.hashIcon, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                    <Text style={{ fontSize: 16 }}>🎵</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hashName}>{item.title || 'Unknown Sound'}</Text>
                    <Text style={styles.hashCount}>{item.creatorName || 'Unknown creator'}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.textMuted} />
                </TouchableOpacity>
              );
            }
            return item._isUser ? renderCreator({ item }) : renderPostGrid({ item });
          }
          if (activeTab === 'trending' || activeTab === 'nearby') return renderPostGrid({ item });
          if (activeTab === 'hashtags') return renderHashtag({ item });
          return renderCreator({ item });
        }}
        ListEmptyComponent={
          !searchQuery && activeTab === 'trending' && !exploreLoading ? (
            <View style={styles.emptyState}>
              <Flame size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No trending content yet</Text>
              <Text style={styles.emptySub}>Check back later for new posts</Text>
            </View>
          ) : !searchQuery && activeTab === 'hashtags' && trendingHashtags.length === 0 ? (
            <View style={styles.emptyState}>
              <Hash size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No hashtags yet</Text>
              <Text style={styles.emptySub}>Hashtags appear as creators use them</Text>
            </View>
          ) : !searchQuery && activeTab === 'creators' && creators.length === 0 && !creatorsLoading ? (
            <View style={styles.emptyState}>
              <Users size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No creators yet</Text>
              <Text style={styles.emptySub}>Follow creators to see their content</Text>
            </View>
          ) : searchQuery && searchError ? (
            <View style={styles.emptyState}>
              <Search size={32} color={colors.danger} />
              <Text style={styles.emptyTitle}>Search failed</Text>
              <Text style={styles.emptySub}>Please try again</Text>
            </View>
          ) : searchQuery ? (
            <View style={styles.emptyState}>
              <Search size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySub}>Try searching for:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm }}>
                {(trendingHashtags.length > 0 ? trendingHashtags.slice(0, 5).map((h: any) => ({ label: `#${h.tag}`, query: h.tag })) : [
                  { label: 'Food', query: 'food' }, { label: 'Travel', query: 'travel' }, { label: 'Music', query: 'music' }, { label: 'Tech', query: 'tech' }, { label: 'Comedy', query: 'comedy' },
                ]).map((s: any) => (
                  <TouchableOpacity key={s.query} onPress={() => setSearchQuery(s.query)} style={styles.suggestionChip}>
                    <Text style={styles.suggestionChipText}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={3}
        ListFooterComponent={
          (activeTab === 'trending' && exploreLoading && explorePosts.length > 0) ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
      />
      <Toast message={toastMessage} type={toastType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: 0 },
  tabsRow: { paddingVertical: spacing.md, flexGrow: 0 },
  tabPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 9999, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  tabPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabPillText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.xs },
  tabPillTextActive: { color: colors.white },
  hashCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  hashIcon: { width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: 'rgba(216,90,48,0.1)', justifyContent: 'center', alignItems: 'center' },
  hashName: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  hashCount: { color: colors.textMuted, fontSize: fontSize.xs },
  followChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  followChipActive: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  followChipText: { color: colors.white, fontWeight: '700', fontSize: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyTitle: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
  emptySub: { color: colors.textMuted, fontSize: fontSize.xs },
  emptySearch: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptySearchTitle: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
  emptySearchSub: { color: colors.textMuted, fontSize: fontSize.xs },
  suggestionChip: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 9999 },
  suggestionChipText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
});
