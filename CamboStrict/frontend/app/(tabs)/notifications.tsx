import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Bell, Check, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { useAuthStore } from '../../src/stores/authStore';
import { NotificationItem } from '../../src/components/notifications/NotificationItem';
import { Toast } from '../../src/components/ui/Toast';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const {
    notifications, readNotification, markAllNotificationsRead,
    fetchNotifications, acceptFollowRequest, declineFollowRequest, startPolling, isLoading,
  } = useNotificationStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Start 30s polling with AppState awareness
  useEffect(() => {
    const stop = startPolling();
    return stop;
  }, [startPolling]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'likes' | 'comments' | 'follow_requests' | 'system'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const userNotifs = useMemo(() =>
    notifications.filter((n) => n.userId === currentUser?.id),
    [notifications, currentUser?.id]
  );

  const unreadCount = useMemo(() =>
    userNotifs.filter((n) => !n.isRead).length,
    [userNotifs]
  );

  const filtered = useMemo(() =>
    userNotifs.filter((n) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'likes') return n.type === 'like';
      if (activeFilter === 'comments') return n.type === 'comment' || n.type === 'mention';
      if (activeFilter === 'follow_requests') return n.type === 'follow_request';
      if (activeFilter === 'system') return n.type === 'system';
      return true;
    }),
    [userNotifs, activeFilter]
  );

  const filters = useMemo(() => [
    { id: 'all' as const, label: 'All', count: userNotifs.filter((n) => !n.isRead).length },
    { id: 'likes' as const, label: 'Likes', count: userNotifs.filter((n) => !n.isRead && n.type === 'like').length },
    { id: 'comments' as const, label: 'Comments', count: userNotifs.filter((n) => !n.isRead && (n.type === 'comment' || n.type === 'mention')).length },
    { id: 'follow_requests' as const, label: 'Requests', count: userNotifs.filter((n) => !n.isRead && n.type === 'follow_request').length },
    { id: 'system' as const, label: 'System', count: userNotifs.filter((n) => !n.isRead && n.type === 'system').length },
  ], [userNotifs]);

  const handleNotificationPress = useCallback((notification: any) => {
    readNotification(notification.id);
    if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'mention') {
      if (notification.targetId) router.push(`/post/${notification.targetId}`);
    } else if (notification.type === 'follow' || notification.type === 'follow_request') {
      router.push(`/user/${notification.actorId}`);
    }
  }, [readNotification]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={16} color={colors.accent} />
          <View>
            <Text style={styles.title}>Inbox Alerts</Text>
            <Text style={styles.subtitle}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/inbox')} style={styles.markReadBtn}>
            <MessageCircle size={14} color={colors.accent} />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllNotificationsRead} style={styles.markReadBtn}>
              <Check size={11} color={colors.accent} />
              <Text style={styles.markReadText}>Mark read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.md }}
        style={{ flexGrow: 0 }}
        renderItem={({ item }) => {
          const isActive = activeFilter === item.id;
          return (
            <TouchableOpacity
              onPress={() => setActiveFilter(item.id)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{item.label}</Text>
              {item.count > 0 && (
                <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, isActive && { color: colors.accent }]}>{item.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {isLoading && filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
            onAcceptFollow={item.type === 'follow_request'
              ? () => acceptFollowRequest(item.id, item.actorId)
              : undefined
            }
            onDeclineFollow={item.type === 'follow_request'
              ? () => declineFollowRequest(item.id, item.actorId)
              : undefined
            }
          />
        )}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Empty Alerts</Text>
            <Text style={styles.emptySub}>No notifications matching this filter.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      )}
      <Toast message={toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.text, fontWeight: '800', fontSize: fontSize.sm },
  subtitle: { color: colors.textMuted, fontSize: fontSize.xs },
  markReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(216,90,48,0.1)', borderWidth: 1, borderColor: 'rgba(216,90,48,0.2)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  markReadText: { color: colors.accent, fontWeight: '700', fontSize: fontSize.xs },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 9999, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filterPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.xs },
  filterTextActive: { color: colors.white },
  filterCount: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  filterCountActive: { backgroundColor: colors.white },
  filterCountText: { color: colors.white, fontSize: 8, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
  emptySub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
});
