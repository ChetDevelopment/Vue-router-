import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Heart, Send } from 'lucide-react-native';
import { Comment } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { BottomSheet } from '../ui/BottomSheet';
import { KHMER_CHIPS } from '../../constants/data';
import { formatDate } from '../../utils/format';

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  postId: string;
  currentUserAvatar: string;
  currentUserName: string;
  onAddComment: (postId: string, content: string, parentCommentId: string | null) => void;
  onLikeComment: (commentId: string, parentCommentId: string | null) => void;
}

export function CommentSheet({
  isOpen,
  onClose,
  comments,
  postId,
  currentUserAvatar,
  currentUserName,
  onAddComment,
  onLikeComment,
}: CommentSheetProps) {
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddComment(postId, text, replyingTo?.id || null);
    setText('');
    setReplyingTo(null);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentRow}>
        <Avatar uri={item.userAvatar} size={28} />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentName}>{item.userDisplayName}</Text>
            <Text style={styles.commentUsername}>@{item.username}</Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
          <View style={styles.commentActions}>
            <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
            <TouchableOpacity onPress={() => setReplyingTo({ id: item.id, username: item.username })}>
              <Text style={styles.replyBtn}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={() => onLikeComment(item.id, null)} style={styles.likeBtn}>
          <Heart size={12} color={item.isLikedByUser ? colors.accent : colors.textMuted} fill={item.isLikedByUser ? colors.accent : 'none'} />
          <Text style={[styles.likeCount, item.isLikedByUser && { color: colors.accent }]}>{item.likeCount}</Text>
        </TouchableOpacity>
      </View>

      {item.replies?.map((reply) => (
        <View key={reply.id} style={styles.replyContainer}>
          <Avatar uri={reply.userAvatar} size={24} />
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentName}>{reply.userDisplayName}</Text>
              <Text style={styles.commentUsername}>@{reply.username}</Text>
            </View>
            <Text style={styles.commentText}>{reply.content}</Text>
            <Text style={styles.commentDate}>{formatDate(reply.createdAt)}</Text>
          </View>
          <TouchableOpacity onPress={() => onLikeComment(reply.id, item.id)} style={styles.likeBtn}>
            <Heart size={10} color={reply.isLikedByUser ? colors.accent : colors.textMuted} fill={reply.isLikedByUser ? colors.accent : 'none'} />
            <Text style={[styles.likeCount, { fontSize: 8 }, reply.isLikedByUser && { color: colors.accent }]}>{reply.likeCount}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height={450}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Comments ({comments.length})</Text>
          <TouchableOpacity onPress={onClose}><X size={16} color={colors.textMuted} /></TouchableOpacity>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptySub}>Start the conversation below!</Text>
            </View>
          }
        />

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

          <View style={styles.chipsRow}>
            {KHMER_CHIPS.slice(0, 4).map((chip, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setText((prev) => (prev ? `${prev} ${chip}` : chip))}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputRow}>
            <Avatar uri={currentUserAvatar} size={28} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={replyingTo ? 'Add a reply...' : 'Add a comment...'}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TouchableOpacity onPress={handleSubmit} disabled={!text.trim()} style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}>
              <Send size={14} color={text.trim() ? colors.white : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  commentContainer: { marginBottom: spacing.lg },
  commentRow: { flexDirection: 'row', gap: spacing.sm },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  commentName: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  commentUsername: { color: colors.textMuted, fontSize: fontSize.xs },
  commentText: { color: colors.text, fontSize: fontSize.sm, marginTop: 2 },
  commentActions: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  commentDate: { color: colors.textMuted, fontSize: fontSize.xs },
  replyBtn: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  likeBtn: { alignItems: 'center', gap: 2 },
  likeCount: { color: colors.textMuted, fontSize: 9, fontWeight: '600' },
  replyContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: 36,
    marginTop: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  emptySub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(216,90,48,0.05)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  replyBannerText: { color: colors.textMuted, fontSize: fontSize.sm },
  replyBannerUser: { color: colors.accent, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' },
  chip: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: { color: colors.text, fontSize: fontSize.xs },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 36,
    color: colors.text,
    fontSize: fontSize.sm,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
});
