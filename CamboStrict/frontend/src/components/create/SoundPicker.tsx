import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { X, Search, Music, Check } from 'lucide-react-native';
import { api } from '../../api/client';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

interface SoundPickerProps {
  visible: boolean;
  selectedSoundId?: string | null;
  onSelect: (sound: any) => void;
  onClose: () => void;
}

export function SoundPicker({ visible, selectedSoundId, onSelect, onClose }: SoundPickerProps) {
  const [query, setQuery] = useState('');
  const [sounds, setSounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (async () => {
      try {
        const trending = await api.sounds.trending();
        setSounds([
          { id: 'original', title: 'Original Audio', creator: 'Use your own sound', duration: '--', category: 'Original' },
          ...(trending || []),
        ]);
      } catch {
        setSounds([
          { id: 'original', title: 'Original Audio', creator: 'Use your own sound', duration: '--', category: 'Original' },
        ]);
      }
      setLoading(false);
    })();
  }, [visible]);

  useEffect(() => {
    if (!query.trim()) { setSounds([]); return; }
    const timer = setTimeout(async () => {
      try {
        const results = await api.sounds.search(query);
        setSounds([
          { id: 'original', title: 'Original Audio', creator: 'Use your own sound', duration: '--', category: 'Original' },
          ...(results || []),
        ]);
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Select a Sound</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Search size={14} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search sounds..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
          </View>

          <ScrollView style={styles.list} contentContainerStyle={{ gap: 2 }}>
            {sounds.map((sound: any) => {
              const isSelected = selectedSoundId === sound.id;
              return (
                <TouchableOpacity
                  key={sound.id}
                  onPress={() => { onSelect(sound); onClose(); }}
                  style={[styles.soundRow, isSelected && styles.soundRowSelected]}
                >
                  <View style={styles.soundIcon}>
                    <Music size={16} color={isSelected ? colors.accent : colors.textMuted} />
                  </View>
                  <View style={styles.soundInfo}>
                    <Text style={styles.soundTitle} numberOfLines={1}>{sound.title}</Text>
                    <Text style={styles.soundCreator}>{sound.creator} · {sound.category}</Text>
                  </View>
                  <Text style={styles.soundDuration}>{sound.duration}</Text>
                  {isSelected && <Check size={16} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity onPress={() => { onSelect(null); onClose(); }} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>Remove Sound</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.sm, height: '100%' },
  list: { paddingHorizontal: spacing.lg, maxHeight: 320 },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  soundRowSelected: { backgroundColor: 'rgba(216,90,48,0.1)' },
  soundIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  soundInfo: { flex: 1 },
  soundTitle: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  soundCreator: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  soundDuration: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  removeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
});
