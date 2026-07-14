import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Hash, Users, Flame, Play, Layers, Heart, MapPin, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { usePostStore } from '../../src/stores/postStore';
import { SearchBar } from '../../src/components/explore/SearchBar';
import { TRENDING_HASHTAGS, INITIAL_USERS } from '../../src/constants/data';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatCount } from '../../src/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48) / 2;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { posts } = usePostStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'hashtags' | 'creators'>('trending');

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.caption.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || p.locationTag?.toLowerCase().includes(q);
  });

  const creators = INITIAL_USERS.filter((u) => u.username !== 'toklok_moderator');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {!searchQuery && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
          {[
            { key: 'trending', icon: Flame, label: 'Trending' },
            { key: 'hashtags', icon: Hash, label: 'Hashtags' },
            { key: 'creators', icon: Users, label: 'Creators' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
              >
                <Icon size={12} color={isActive ? colors.white : colors.textMuted} />
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={searchQuery ? filteredPosts : activeTab === 'trending' ? posts : []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListHeaderComponent={
          searchQuery ? null : activeTab === 'hashtags' ? (
            <View style={{ gap: spacing.sm }}>
              {TRENDING_HASHTAGS.map((ht) => (
                <TouchableOpacity key={ht.id} onPress={() => setSearchQuery(`#${ht.tag}`)} style={styles.hashCard}>
                  <View style={styles.hashIcon}>
                    <Hash size={16} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hashName}>#{ht.tag}</Text>
                    <Text style={styles.hashCount}>{formatCount(ht.postCount)} posts</Text>
                  </View>
                  <ChevronRight size={14} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : activeTab === 'creators' ? (
            <View style={{ gap: spacing.sm }}>
              {creators.map((creator) => (
                <TouchableOpacity key={creator.id} onPress={() => setSearchQuery(`@${creator.username}`)} style={styles.creatorCard}>
                  <Image source={{ uri: creator.avatarUrl }} style={styles.creatorAvatar} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.creatorName}>{creator.displayName}</Text>
                      {creator.isVerified && <CheckCircle2 size={12} color={colors.accent} />}
                    </View>
                    <Text style={styles.creatorUsername}>@{creator.username}</Text>
                    <Text style={styles.creatorBio} numberOfLines={1}>{creator.bio}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item: post }) => (
          <TouchableOpacity style={styles.gridCard}>
            <Image source={{ uri: post.coverThumbnailUrl }} style={styles.gridImage} />
            <View style={styles.gridType}>
              {post.type === 'video' ? <Play size={10} color={colors.white} /> : post.type === 'carousel' ? <Layers size={10} color={colors.white} /> : null}
            </View>
            {post.locationTag && (
              <View style={styles.gridLocation}>
                <MapPin size={7} color={colors.accent} />
                <Text style={styles.gridLocationText}>{post.locationTag.split(',')[0]}</Text>
              </View>
            )}
            <View style={styles.gridOverlay}>
              <Text style={styles.gridUser} numberOfLines={1}>@{post.username}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Heart size={8} color={colors.accent} fill={colors.accent} />
                <Text style={styles.gridLikes}>{formatCount(post.likeCount)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
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
  gridCard: { width: CARD_W, aspectRatio: 3 / 4, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gridType: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: borderRadius.sm },
  gridLocation: { position: 'absolute', top: spacing.sm, left: spacing.sm, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, gap: 2 },
  gridLocationText: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.sm, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridUser: { color: colors.text, fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
  gridLikes: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
  hashCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  hashIcon: { width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: 'rgba(216,90,48,0.1)', justifyContent: 'center', alignItems: 'center' },
  hashName: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  hashCount: { color: colors.textMuted, fontSize: fontSize.xs },
  creatorCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  creatorAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  creatorName: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  creatorUsername: { color: colors.textMuted, fontSize: fontSize.xs },
  creatorBio: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
});
