import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trophy, Flame, Eye, Heart } from 'lucide-react-native';
import { api } from '../src/api/client';
import { colors, borderRadius, fontSize, spacing } from '../src/constants/theme';
import { formatCount } from '../src/utils/format';

const PROVINCE_EMOJIS: Record<string, string> = {
  'Phnom Penh': '🏙️', 'Siem Reap': '🏛️', 'Battambang': '🎭', 'Sihanoukville': '🏖️',
  'Kampot': '🌊', 'Mondulkiri': '🌲', 'Kratie': '🐬', 'Kampong Cham': '🌾',
  'Preah Sihanouk': '🏝️', 'Takeo': '🏯', 'Kandal': '🌴', 'Pursat': '⛰️',
  'Kampong Thom': '🌳', 'Ratanakiri': '🗿', 'Stung Treng': '🏞️', 'Oddar Meanchey': '🏔️',
  'Banteay Meanchey': '🏗️', 'Kampong Chhnang': '🏺', 'Kampong Speu': '🍊',
  'Koh Kong': '🌴', 'Preah Vihear': '⛩️', 'Svay Rieng': '🌾', 'Prey Veng': '🌿',
  'Tboung Khmum': '🌳', 'Kep': '🏖️', 'Pailin': '💎',
};

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.posts.leaderboard(period);
      setData(res?.leaderboard || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Provincial Leaderboard</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.toggleRow}>
        {(['weekly', 'monthly', 'all'] as const).map((p) => (
          <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[s.toggleBtn, period === p && s.toggleActive]}>
            <Text style={[s.toggleText, period === p && s.toggleTextActive]}>{p === 'weekly' ? 'This Week' : p === 'monthly' ? 'This Month' : 'All Time'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: any) => item.province}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={
            <View style={{ padding: 60, alignItems: 'center', gap: spacing.md }}>
              <Trophy size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.md }}>No provincial data yet</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' }}>Posts need location tags to appear on the leaderboard</Text>
            </View>
          }
          renderItem={({ item, index }: { item: any; index: number }) => (
            <TouchableOpacity
              onPress={() => router.push(`/hashtag/${encodeURIComponent(item.province)}`)}
              style={[s.card, index < 3 && s.topCard]}
            >
              <View style={s.rankBadge}>
                <Text style={[s.rankText, index < 3 && { color: colors.accent }]}>#{index + 1}</Text>
              </View>
              <Text style={{ fontSize: 28, marginRight: spacing.sm }}>{PROVINCE_EMOJIS[item.province] || '📍'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.provinceName}>{item.province}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Heart size={10} color={colors.accent} />
                    <Text style={s.statText}>{formatCount(item.total_likes || 0)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Eye size={10} color={colors.textMuted} />
                    <Text style={s.statText}>{formatCount(item.total_views || 0)}</Text>
                  </View>
                  <Text style={s.statText}>{item.post_count || 0} posts</Text>
                </View>
                {item.top_creator && (
                  <TouchableOpacity onPress={() => router.push(`/user/${item.top_creator_id}`)}>
                    <Text style={s.creatorText}>Top: @{item.top_creator}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg, flex: 1, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  toggleBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 9999, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  toggleActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  toggleText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  toggleTextActive: { color: colors.white },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  topCard: { borderColor: colors.accent, backgroundColor: 'rgba(216,90,48,0.05)' },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  rankText: { color: colors.textMuted, fontWeight: '800', fontSize: fontSize.sm },
  provinceName: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  statText: { color: colors.textMuted, fontSize: fontSize.xs },
  creatorText: { color: colors.accent, fontSize: fontSize.xs, marginTop: 2 },
});
