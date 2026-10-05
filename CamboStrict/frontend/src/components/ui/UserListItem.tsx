import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from './Avatar';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

interface UserListItemProps {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified?: boolean;
  bio?: string;
  rightAction?: React.ReactNode;
}

export const UserListItem = memo(function UserListItem({ id, username, displayName, avatarUrl, isVerified, bio, rightAction }: UserListItemProps) {
  return (
    <TouchableOpacity onPress={() => router.push(`/user/${id}`)} style={styles.row}>
      <Avatar uri={avatarUrl} size={44} isVerified={isVerified} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.username}>@{username}</Text>
        {bio ? <Text style={styles.bio} numberOfLines={1}>{bio}</Text> : null}
      </View>
      {rightAction}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  username: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  bio: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
});
