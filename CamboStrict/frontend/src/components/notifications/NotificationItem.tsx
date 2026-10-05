import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, MessageCircle, UserPlus, Bell, AtSign, ShieldAlert, UserCheck } from 'lucide-react-native';
import { Notification } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../utils/format';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onAcceptFollow?: () => void;
  onDeclineFollow?: () => void;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  like: { icon: Heart, color: '#E24B4A' },
  comment: { icon: MessageCircle, color: colors.accent },
  mention: { icon: AtSign, color: '#A855F7' },
  follow: { icon: UserPlus, color: '#38BDF8' },
  follow_request: { icon: UserPlus, color: '#F59E0B' },
  system: { icon: ShieldAlert, color: '#10B981' },
  gift: { icon: Bell, color: '#F59E0B' },
};

const getLabel = (type: string) => {
  const labels: Record<string, string> = {
    like: 'liked your post.',
    comment: 'commented on your post.',
    follow: 'started following you.',
    follow_request: 'requested to follow you.',
    system: '',
    gift: 'sent you a gift!',
  };
  return labels[type] || 'interacted with you.';
};

export const NotificationItem = memo(function NotificationItem({ notification, onPress, onAcceptFollow, onDeclineFollow }: NotificationItemProps) {
  const config = typeConfig[notification.type] || { icon: Bell, color: colors.textMuted };
  const Icon = config.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, !notification.isRead && styles.unread]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { borderColor: config.color + '30', backgroundColor: config.color + '15' }]}>
        <Icon size={14} color={config.color} strokeWidth={2.2} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          {notification.type !== 'system' ? (
            <Avatar uri={notification.actorAvatar} size={20} />
          ) : null}
          <Text style={styles.message} numberOfLines={2}>
            {notification.type === 'system' ? (
              <Text style={styles.systemBadge}>System Notice</Text>
            ) : (
              <Text style={styles.username}>@{notification.actorUsername} </Text>
            )}
            <Text style={styles.label}>
              {notification.type !== 'system' ? getLabel(notification.type) : ''}
            </Text>
          </Text>
        </View>

        {notification.message && (
          <Text style={styles.systemMsg} numberOfLines={2}>{notification.message}</Text>
        )}

        {notification.type === 'follow_request' && onAcceptFollow && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onAcceptFollow} style={styles.approveBtn}>
              <UserCheck size={10} color={colors.white} />
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDeclineFollow || onPress} style={styles.ignoreBtn}>
              <Text style={styles.ignoreText}>Ignore</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.date}>{formatRelativeTime(notification.createdAt)}</Text>
      </View>

      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  unread: { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  content: { flex: 1, gap: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  message: { fontSize: fontSize.sm, color: colors.text, lineHeight: 18, flex: 1 },
  username: { fontWeight: '700', color: colors.text },
  label: { color: colors.textMuted, fontWeight: '500' },
  systemBadge: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: fontSize.xs,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  systemMsg: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  approveText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  ignoreBtn: {
    backgroundColor: colors.bgLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  ignoreText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  date: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
});
