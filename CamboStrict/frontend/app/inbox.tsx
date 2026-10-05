import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, ChevronRight, Search, X } from 'lucide-react-native';
import { api } from '../src/api/client';
import { useAuthStore } from '../src/stores/authStore';
import { Avatar } from '../src/components/ui/Avatar';
import { colors, borderRadius, fontSize, spacing } from '../src/constants/theme';
import { noOutline } from '../src/stores/shared/constants';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.messages.conversations();
      setConversations(data || []);
    } catch (e) { console.warn('Failed to fetch conversations', e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { const interval = setInterval(fetch, 5000); return () => clearInterval(interval); }, [fetch]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await api.users.search(searchQuery);
        setSearchResults(users || []);
      } catch (e) { console.warn('User search failed', e); } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartConversation = async (userId: string) => {
    try {
      const conv = await api.messages.createConversation(userId);
      setShowNew(false);
      setSearchQuery('');
      router.push(`/messages/${conv.id}`);
    } catch (e) { console.warn('Failed to create conversation', e); }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <MessageCircle size={16} color={colors.accent} />
        <Text style={s.title}>Messages</Text>
        <TouchableOpacity onPress={() => setShowNew(true)} style={s.newBtn}>
          <Text style={{ fontSize: 20, color: colors.accent, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={
            <View style={{ padding: 60, alignItems: 'center', gap: spacing.md }}>
              <MessageCircle size={32} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>No messages yet</Text>
              <TouchableOpacity onPress={() => setShowNew(true)} style={s.newConvBtn}>
                <Text style={{ fontSize: 16, color: colors.white, fontWeight: '700', marginRight: 4 }}>+</Text>
                <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.sm }}>New Message</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity onPress={() => router.push(`/messages/${item.id}`)} style={s.row}>
              <Avatar uri={item.otherAvatar || item.other_avatar || ''} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.otherUsername || item.other_username || 'Unknown'}</Text>
                <Text style={s.preview} numberOfLines={1}>{item.lastMessage || 'No messages'}</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showNew} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={() => { setShowNew(false); setSearchQuery(''); }}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={s.searchRow}>
              <Search size={14} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search users..."
                placeholderTextColor={colors.textMuted}
                style={[s.searchInput, noOutline]}
                autoFocus
              />
            </View>
            {searching ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 40 }} />
            ) : searchQuery.trim() && searchResults.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>No users found</Text>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={{ marginTop: spacing.md }}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity onPress={() => handleStartConversation(item.id)} style={s.userRow}>
                    <Avatar uri={item.avatarUrl || ''} size={40} isVerified={item.isVerified} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.name}>{item.displayName || item.username}</Text>
                      <Text style={s.preview}>@{item.username}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontWeight: '800', fontSize: fontSize.md, flex: 1 },
  newBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(216,90,48,0.1)', justifyContent: 'center', alignItems: 'center' },
  newConvBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  name: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  preview: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, margin: spacing.lg, paddingHorizontal: spacing.md, height: 40 },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.sm },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, paddingHorizontal: spacing.lg },
});
