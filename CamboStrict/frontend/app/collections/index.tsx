import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FolderOpen, ChevronRight } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatCount } from '../../src/utils/format';

const EMOJIS = ['📁', '❤️', '🍜', '✈️', '🎵', '😂', '💻', '🎮', '📚', '🏋️', '🎨', '🌴', '🔥', '⭐', '💡'];

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📁');
  const [creating, setCreating] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.collections.list();
      setCollections(data || []);
    } catch { if (collections.length === 0) setCollections([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
    setCreating(true);
    try {
      await api.collections.create(newName.trim(), newEmoji);
      setShowCreate(false);
      setNewName('');
      setNewEmoji('📁');
      fetchCollections();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create collection');
    } finally { setCreating(false); }
  };

  const handleDelete = (collection: any) => {
    Alert.alert('Delete Collection', `Delete "${collection.name}"? The posts won't be removed from your saved posts.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const posts = await api.collections.getPosts(collection.id);
          for (const p of posts || []) {
            await api.collections.removePost(collection.id, p.id);
          }
          fetchCollections();
        } catch (e) { console.error(e); }
      }},
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <Text style={{ fontSize: 20, color: colors.accent, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={
            <View style={{ padding: 60, alignItems: 'center', gap: spacing.md }}>
              <FolderOpen size={48} color={colors.accent} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.md, fontWeight: '600' }}>No collections yet</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' }}>Create collections to organize your saved posts</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.createBtn}>
                <Text style={{ fontSize: 16, color: colors.white, fontWeight: '700', marginRight: 4 }}>+</Text>
                <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.sm }}>Create Collection</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/collections/${item.id}`)}
              onLongPress={() => handleDelete(item)}
              style={styles.collectionCard}
            >
              <Text style={{ fontSize: 32, marginRight: spacing.md }}>{item.emoji || '📁'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.collectionName}>{item.name}</Text>
                <Text style={styles.collectionCount}>{item.post_count || 0} posts</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Collection name"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoFocus
              maxLength={50}
            />
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginBottom: spacing.sm }}>Choose an emoji:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setNewEmoji(emoji)}
                  style={[styles.emojiOption, newEmoji === emoji && styles.emojiSelected]}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={[styles.modalBtn, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} disabled={creating} style={[styles.modalBtn, { backgroundColor: colors.accent }]}>
                {creating ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={{ color: colors.white, fontWeight: '700' }}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(216,90,48,0.1)', justifyContent: 'center', alignItems: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  collectionCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg },
  collectionName: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  collectionCount: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: colors.bgCard, borderRadius: borderRadius.xl, padding: spacing.lg },
  modalTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg, marginBottom: spacing.md },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.md },
  emojiOption: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emojiSelected: { borderColor: colors.accent, backgroundColor: 'rgba(216,90,48,0.1)' },
  modalBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
});
