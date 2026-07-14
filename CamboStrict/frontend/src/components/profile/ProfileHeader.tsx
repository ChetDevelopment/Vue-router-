import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Edit2, Globe, ExternalLink, Gift, UserPlus, TrendingUp, Grid, Bookmark, BarChart2 } from 'lucide-react-native';
import { User } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { formatCount } from '../../utils/format';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  onSaveProfile: (fields: Partial<User>) => void;
  onToggleCreator: () => void;
  onOpenSettings: () => void;
  onSupportCreator?: (user: any) => void;
  activeTab: 'posts' | 'saved' | 'analytics';
  onTabChange: (tab: 'posts' | 'saved' | 'analytics') => void;
  postCount: number;
}

export function ProfileHeader({
  user,
  isOwnProfile,
  onSaveProfile,
  onToggleCreator,
  onOpenSettings,
  onSupportCreator,
  activeTab,
  onTabChange,
  postCount,
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [link, setLink] = useState(user.link || '');

  const handleSave = () => {
    onSaveProfile({ displayName, bio, link });
    setIsEditing(false);
  };

  const tabs = [
    { key: 'posts' as const, icon: Grid, label: `Posts (${postCount})` },
    ...(isOwnProfile ? [{ key: 'saved' as const, icon: Bookmark, label: 'Saved' }] : []),
    ...(isOwnProfile && user.isCreator ? [{ key: 'analytics' as const, icon: BarChart2, label: 'Analytics' }] : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.usernameRow}>
          <Text style={styles.studioBadge}>{isOwnProfile ? 'My Studio' : 'Creator Profile'}</Text>
          <Text style={styles.username}>@{user.username}</Text>
        </View>
        {isOwnProfile && (
          <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn}>
            <Edit2 size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          <Avatar uri={user.avatarUrl} size={72} isVerified={user.isVerified} />
          {isOwnProfile && !isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBadge}>
              <Edit2 size={10} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput value={displayName} onChangeText={setDisplayName} style={styles.editInput} placeholder="Display Name" placeholderTextColor={colors.textMuted} />
            <TextInput value={bio} onChangeText={setBio} style={[styles.editInput, styles.editBio]} placeholder="Bio" placeholderTextColor={colors.textMuted} multiline />
            <TextInput value={link} onChangeText={setLink} style={styles.editInput} placeholder="Link" placeholderTextColor={colors.textMuted} />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.bio}>{user.bio}</Text>
            {user.link && (
              <View style={styles.linkRow}>
                <Globe size={10} color={colors.accent} />
                <Text style={styles.linkText}>{user.link}</Text>
                <ExternalLink size={8} color={colors.accent} />
              </View>
            )}
            <View style={styles.actionRow}>
              {!isOwnProfile ? (
                <>
                  <TouchableOpacity style={styles.followBtn}>
                    <UserPlus size={13} color={colors.white} />
                    <Text style={styles.followBtnText}>Follow</Text>
                  </TouchableOpacity>
                  {onSupportCreator && (
                    <TouchableOpacity onPress={onSupportCreator} style={styles.supportBtn}>
                      <Gift size={13} color={colors.white} />
                      <Text style={styles.supportBtnText}>Support Creator</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editProfileBtn}>
                  <Edit2 size={12} color={colors.accent} />
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <StatItem value={formatCount(user.followerCount)} label="Followers" />
          <StatItem value={formatCount(user.followingCount)} label="Following" />
          <StatItem value={formatCount(user.totalLikesReceived)} label="Likes" />
        </View>

        {isOwnProfile && !isEditing && (
          <TouchableOpacity onPress={onToggleCreator} style={styles.creatorToggle}>
            <TrendingUp size={14} color={user.isCreator ? colors.text : colors.accent} />
            <Text style={[styles.creatorText, !user.isCreator && { color: colors.accent }]}>
              {user.isCreator ? 'Creator Analytics Active' : 'Switch to Creator Profile'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Icon size={13} color={isActive ? colors.text : colors.textMuted} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studioBadge: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '700',
    backgroundColor: 'rgba(216,90,48,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(216,90,48,0.25)',
    overflow: 'hidden',
  },
  username: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: { padding: spacing.lg, alignItems: 'center', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { alignItems: 'center', gap: spacing.sm, width: '100%' },
  displayName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  bio: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', maxWidth: 280 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  followBtn: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  followBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  supportBtn: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  supportBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  editProfileBtn: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  editProfileText: { color: colors.accent, fontWeight: '700', fontSize: fontSize.sm },
  editForm: { width: '100%', gap: spacing.sm },
  editInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.sm,
  },
  editBio: { height: 60, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '500' },
  creatorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  creatorText: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextActive: { color: colors.text, fontWeight: '700' },
});
