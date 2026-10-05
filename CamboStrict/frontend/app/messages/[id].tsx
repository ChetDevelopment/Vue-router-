import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { formatRelativeTime } from '../../src/utils/format';
import { noOutline } from '../../src/stores/shared/constants';

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.messages.getMessages(id!);
      setMessages(data || []);
      await api.messages.markRead(id!);
    } catch { Alert.alert('Error', 'Failed to load messages'); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { const interval = setInterval(fetchMessages, 3000); return () => clearInterval(interval); }, [fetchMessages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await api.messages.sendMessage(id!, text);
      setText('');
      fetchMessages();
    } catch { Alert.alert('Error', 'Failed to send message'); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : 'padding'} style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
        <Text style={s.title}>Messages</Text>
        <View style={{ width: 22 }} />
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item: any) => item.id}
        inverted
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        renderItem={({ item }: { item: any }) => {
          const isMine = item.senderId === currentUser?.id;
          return (
            <View style={[s.bubble, isMine ? s.myBubble : s.theirBubble]}>
              <Text style={[s.bubbleText, isMine && { color: colors.white }]}>{item.content}</Text>
              <Text style={[s.time, isMine && { color: 'rgba(255,255,255,0.5)' }]}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
          );
        }}
      />
      <View style={s.inputRow}>
        <TextInput value={text} onChangeText={setText} placeholder="Message..." placeholderTextColor={colors.textMuted}
          style={[s.input, noOutline]} />
        <TouchableOpacity onPress={handleSend} disabled={!text.trim()} style={[s.sendBtn, !text.trim() && { opacity: 0.4 }]}>
          <Send size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.md, flex: 1 },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: borderRadius.lg, marginVertical: 2 },
  myBubble: { backgroundColor: colors.accent, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: colors.bgCard, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.text, fontSize: fontSize.sm, lineHeight: 18 },
  time: { color: colors.textMuted, fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 40, color: colors.text, fontSize: fontSize.sm },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
});
