import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { lightHaptic } from '../../utils/haptics';
import { X, Heart, Send, Trash2 } from 'lucide-react-native';
import { Comment } from '../../types';
import { api } from '../../api/client';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { BottomSheet } from '../ui/BottomSheet';
import { noOutline } from '../../stores/shared/constants';
import { KHMER_STICKERS } from '../../constants/data';
import { formatRelativeTime } from '../../utils/format';

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments?: Comment[];
  postId: string;
  currentUserAvatar: string;
  currentUserName: string;
  currentUserId?: string;
  onAddComment: (postId: string, content: string, parentCommentId: string | null) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
}

// Build nested tree from flat list with parent_comment_id
function buildCommentTree(flat: any[]): Comment[] {
  const map = new Map<string, any>();
  const roots: any[] = [];
  flat.forEach(c => { map.set(c.id, { ...c, replies: [] }); });
  flat.forEach(c => {
    const node = map.get(c.id);
    if (c.parentCommentId && map.has(c.parentCommentId)) {
      map.get(c.parentCommentId).replies.push(node);
    } else if (!c.parentCommentId) {
      roots.push(node);
    }
  });
  return roots;
}

export function CommentSheet({
  isOpen,
  onClose,
  comments: propComments,
  postId,
  currentUserAvatar,
  currentUserName,
  currentUserId,
  onAddComment,
  onDeleteComment,
}: CommentSheetProps) {
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const inputRef = useRef<TextInput>(null);

  const treeComments = useMemo(() => buildCommentTree(localComments), [localComments]);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const data = await api.comments.list(postId);
      setLocalComments(data || []);
    } catch (e) { console.error(e); } finally { setLoadingComments(false); }
  }, [postId]);

  useEffect(() => {
    if (isOpen && postId) fetchComments();
  }, [isOpen, postId, fetchComments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComments();
    setRefreshing(false);
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddComment(postId, text, replyingTo?.id || null);
      setText('');
      setReplyingTo(null);
      await fetchComments();
      lightHaptic();
    } catch {
      // Error handled by parent
    } finally { setIsSubmitting(false); }
  };

  // @mention detection with debounce
  const mentionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const atIndex = text.lastIndexOf('@');
    if (atIndex >= 0 && (atIndex === 0 || text[atIndex - 1] === ' ')) {
      const search = text.substring(atIndex + 1).split(' ')[0].toLowerCase();
      if (search.length >= 1) {
        setMentionSearch(search);
        setShowMentions(true);
        if (mentionTimer.current) clearTimeout(mentionTimer.current);
        mentionTimer.current = setTimeout(() => {
          api.users.search(search).then(users => setMentionResults(users || [])).catch(() => {});
        }, 300);
        return;
      }
    }
    setShowMentions(false);
    return () => { if (mentionTimer.current) clearTimeout(mentionTimer.current); };
  }, [text]);

  const insertMention = (username: string) => {
    const atIndex = text.lastIndexOf('@');
    const before = text.substring(0, atIndex);
    const after = text.substring(atIndex).split(' ').slice(1).join(' ');
    setText(`${before}@${username} ${after}`);
    setShowMentions(false);
  };

  const toggleReplies = (id: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderCommentItem = (item: Comment, isReply = false) => (
    <View key={item.id} style={isReply ? styles.replyContainer : styles.commentContainer}>
      <View style={styles.commentRow}>
        <Avatar uri={item.userAvatar} size={isReply ? 24 : 28} />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentName}>{item.userDisplayName}</Text>
            <Text style={styles.commentUsername}>@{item.username}</Text>
          </View>
          <Text style={styles.commentText}>
            {item.content.split(/(@\w+)/g).map((part, i) =>
              part.startsWith('@') ? (
                <Text key={i} style={{ color: colors.accent, fontWeight: '600' }} onPress={() => router.push(`/user/${part.substring(1)}`)}>
                  {part}
                </Text>
              ) : part
            )}
          </Text>
          <View style={styles.commentActions}>
            <Text style={styles.commentDate}>{formatRelativeTime(item.createdAt)}</Text>
            {!isReply && (
              <TouchableOpacity onPress={() => setReplyingTo({ id: item.id, username: item.username })}>
                <Text style={styles.replyBtn}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <TouchableOpacity onPress={async () => {
            const prev = { ...item };
            setLocalComments((prev2: any) => prev2.map((c: any) => {
              if (isReply) {
                return { ...c, replies: (c.replies || []).map((r: any) => r.id === item.id ? { ...r, isLikedByUser: !r.isLikedByUser, likeCount: r.isLikedByUser ? r.likeCount - 1 : r.likeCount + 1 } : r) };
              }
              return c.id === item.id ? { ...c, isLikedByUser: !c.isLikedByUser, likeCount: c.isLikedByUser ? c.likeCount - 1 : c.likeCount + 1 } : c;
            }));
            try {
              if (item.isLikedByUser) await api.comments.unlike(postId, item.id);
              else await api.comments.like(postId, item.id);
            } catch {
              // Rollback
              setLocalComments((prev2: any) => prev2.map((c: any) => {
                if (isReply) {
                  return { ...c, replies: (c.replies || []).map((r: any) => r.id === item.id ? prev : r) };
                }
                return c.id === item.id ? prev : c;
              }));
            }
          }} style={styles.likeBtn}>
            <Heart size={isReply ? 10 : 12} color={item.isLikedByUser ? colors.accent : colors.textMuted} fill={item.isLikedByUser ? colors.accent : 'none'} />
            <Text style={[styles.likeCount, { fontSize: isReply ? 8 : 9 }, item.isLikedByUser && { color: colors.accent }]}>{item.likeCount}</Text>
          </TouchableOpacity>
          {currentUserId && item.userId === currentUserId && (
            <TouchableOpacity onPress={() => onDeleteComment?.(postId, item.id)} style={styles.likeBtn}>
              <Trash2 size={11} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => {
    const hasReplies = (item.replies?.length || 0) > 0;
    const expanded = expandedReplies.has(item.id);
    return (
      <View>
        {renderCommentItem(item)}
        {hasReplies && !expanded && (
          <TouchableOpacity onPress={() => toggleReplies(item.id)} style={styles.showRepliesBtn}>
            <Text style={styles.showRepliesText}>{item.replies!.length} replies</Text>
          </TouchableOpacity>
        )}
        {expanded && item.replies?.map(r => renderCommentItem(r, true))}
      </View>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height={500}>
      <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : 'padding'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Comments ({localComments.length})</Text>
          <TouchableOpacity onPress={onClose}><X size={16} color={colors.textMuted} /></TouchableOpacity>
        </View>

        {loadingComments ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
        <FlatList
          data={treeComments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          style={{ flex: 1 }}
          keyboardDismissMode="on-drag"
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptySub}>Start the conversation below!</Text>
            </View>
          }
        />
        )}

        {/* @mention dropdown */}
        {showMentions && mentionResults.length > 0 && (
          <View style={styles.mentionDropdown}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mentionResults.slice(0, 5).map((u: any) => (
                <TouchableOpacity key={u.id} onPress={() => insertMention(u.username)} style={styles.mentionChip}>
                  <Text style={styles.mentionChipText}>@{u.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText}>
                Replying to <Text style={styles.replyBannerUser}>@{replyingTo.username}</Text>
              </Text>
              <TouchableOpacity onPress={() => { setReplyingTo(null); setText(''); }}>
                <X size={12} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm, flexGrow: 0 }}>
            <View style={styles.chipsRow}>
              {KHMER_STICKERS.map((sticker) => (
                <TouchableOpacity
                  key={sticker.text}
                  onPress={() => setText((prev) => (prev ? `${prev} ${sticker.text}` : sticker.text))}
                  style={[styles.stickerChip, { borderColor: sticker.color + '40' }]}
                >
                  <Text style={{ fontSize: 20 }}>{sticker.emoji}</Text>
                  <Text style={styles.stickerText}>{sticker.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.inputRow}>
            <Avatar uri={currentUserAvatar} size={28} />
            <TextInput
              ref={inputRef as any}
              value={text}
              onChangeText={setText}
              placeholder={replyingTo ? 'Add a reply...' : 'Add a comment...'}
              placeholderTextColor={colors.textMuted}
              maxLength={500}
              style={[styles.input, noOutline]}
            />
            <TouchableOpacity onPress={handleSubmit} disabled={!text.trim() || isSubmitting} style={[styles.sendBtn, (!text.trim() || isSubmitting) && styles.sendBtnDisabled]}>
              <Send size={14} color={(text.trim() && !isSubmitting) ? colors.white : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  commentContainer: { marginBottom: spacing.lg },
  commentRow: { flexDirection: 'row', gap: spacing.sm },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  commentName: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  commentUsername: { color: colors.textMuted, fontSize: fontSize.xs },
  commentText: { color: colors.text, fontSize: fontSize.sm, marginTop: 2, lineHeight: 18 },
  commentActions: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  commentDate: { color: colors.textMuted, fontSize: fontSize.xs },
  replyBtn: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  likeBtn: { alignItems: 'center', gap: 2 },
  likeCount: { color: colors.textMuted, fontSize: 9, fontWeight: '600' },
  replyContainer: { flexDirection: 'row', gap: spacing.sm, marginLeft: 36, marginTop: spacing.md, paddingLeft: spacing.md, borderLeftWidth: 1, borderLeftColor: colors.border },
  showRepliesBtn: { marginLeft: 36, paddingVertical: spacing.xs, marginTop: -spacing.sm, marginBottom: spacing.sm },
  showRepliesText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  emptySub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  inputContainer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg, padding: spacing.md },
  replyBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(216,90,48,0.05)', padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  replyBannerText: { color: colors.textMuted, fontSize: fontSize.sm },
  replyBannerUser: { color: colors.accent, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', gap: spacing.xs, paddingVertical: 2 },
  chip: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  chipText: { color: colors.text, fontSize: fontSize.xs },
  stickerChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgCard, borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  stickerText: { color: colors.text, fontSize: fontSize.xs, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 36, color: colors.text, fontSize: fontSize.sm },
  sendBtn: { width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  mentionDropdown: { position: 'absolute', bottom: 160, left: spacing.md, right: spacing.md, backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, zIndex: 50, maxHeight: 44 },
  mentionChip: { backgroundColor: colors.bgLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, marginRight: spacing.xs },
  mentionChipText: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
});
