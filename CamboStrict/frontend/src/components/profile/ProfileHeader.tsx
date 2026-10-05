import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Edit2, Globe, ExternalLink, UserPlus, TrendingUp, Grid, Bookmark, BarChart2, Camera, Shield } from 'lucide-react-native';
import { User } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { formatCount } from '../../utils/format';
import { noOutline } from '../../stores/shared/constants';
import * as Linking from 'expo-linking';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  onSaveProfile: (fields: Partial<User>) => void;
  onToggleCreator: () => void;
  onOpenSettings: () => void;
  onFollowUser?: (userId: string) => void;
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
  onFollowUser,
  activeTab,
  onTabChange,
  postCount,
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [link, setLink] = useState(user.link || '');
  const [avatarUri, setAvatarUri] = useState(user.avatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const pickAvatar = async () => {
    if (Platform.OS === 'web') return;
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setIsUploadingAvatar(true);
      try {
        const formData = new FormData();
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        formData.append('file', { uri: localUri, name: filename, type: 'image/jpeg' } as any);
        const { api } = await import('../../api/client');
        const data = await api.users.uploadAvatar(formData);
        setAvatarUri(data?.avatarUrl || localUri);
      } catch {
        setAvatarUri(localUri);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSave = () => {
    if (!displayName.trim()) { Alert.alert('Error', 'Display name cannot be empty'); return; }
    onSaveProfile({ displayName: displayName.trim(), bio: bio.trim(), link: link.trim(), avatarUrl: avatarUri });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAvatarUri(user.avatarUrl);
    setDisplayName(user.displayName);
    setBio(user.bio);
    setLink(user.link || '');
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
          {user.isCreator && (
            <View style={styles.creatorBadge}>
              <Shield size={12} color={colors.accent} />
              <Text style={styles.creatorBadgeText}>Creator</Text>
            </View>
          )}
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
          <TouchableOpacity onPress={isEditing ? pickAvatar : undefined} disabled={!isEditing}>
            <Avatar uri={avatarUri} size={72} isVerified={user.isVerified} />
            {isUploadingAvatar && (
              <View style={[styles.avatarEditOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            )}
            {isEditing && !isUploadingAvatar && (
              <View style={styles.avatarEditOverlay}>
                <Camera size={14} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
          {isOwnProfile && !isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBadge}>
              <Edit2 size={10} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput value={displayName} onChangeText={setDisplayName} style={[styles.editInput, noOutline]} placeholder="Display Name" placeholderTextColor={colors.textMuted} />
            <TextInput value={bio} onChangeText={setBio} style={[styles.editInput, styles.editBio, noOutline]} placeholder="Bio" placeholderTextColor={colors.textMuted} multiline />
            <TextInput value={link} onChangeText={setLink} style={[styles.editInput, noOutline]} placeholder="Link" placeholderTextColor={colors.textMuted} />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
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
              <TouchableOpacity onPress={() => { try { const l = user.link || ''; Linking.openURL(l.startsWith('http') ? l : 'https://' + l); } catch (e) { console.error(e); } }} style={styles.linkRow}>
                <Globe size={10} color={colors.accent} />
                <Text style={styles.linkText}>{user.link}</Text>
                <ExternalLink size={8} color={colors.accent} />
              </TouchableOpacity>
            )}
            <View style={styles.actionRow}>
              {!isOwnProfile ? (
                <>
                  <TouchableOpacity onPress={() => onFollowUser?.(user.id)} style={styles.followBtn}>
                    <UserPlus size={13} color={colors.white} />
                    <Text style={styles.followBtnText}>Follow</Text>
                  </TouchableOpacity>
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
          <TouchableOpacity onPress={isOwnProfile ? () => router.push(`/followers/${user.id}`) : undefined} style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(user.followerCount)}</Text><Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={isOwnProfile ? () => router.push(`/following/${user.id}`) : undefined} style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(user.followingCount)}</Text><Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(postCount)}</Text><Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(user.totalLikesReceived)}</Text><Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {isOwnProfile && !isEditing && (
          <>
            <TouchableOpacity onPress={() => router.push('/collections')} style={[styles.creatorToggle, { borderColor: colors.border }]}>
              <Bookmark size={14} color={colors.accent} />
              <Text style={[styles.creatorText, { color: colors.accent }]}>Collections</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/leaderboard')} style={[styles.creatorToggle, { borderColor: colors.border }]}>
              <TrendingUp size={14} color={colors.accent} />
              <Text style={[styles.creatorText, { color: colors.accent }]}>Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onToggleCreator} style={styles.creatorToggle}>
              <TrendingUp size={14} color={user.isCreator ? colors.text : colors.accent} />
              <Text style={[styles.creatorText, !user.isCreator && { color: colors.accent }]}>
                {user.isCreator ? 'Creator mode on' : 'Enable creator mode'}
              </Text>
            </TouchableOpacity>
          </>
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
  creatorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(216,90,48,0.12)',
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'rgba(216,90,48,0.25)',
  },
  creatorBadgeText: { color: colors.accent, fontSize: 10, fontWeight: '700' },
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
  profileSection: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  avatarWrap: { position: 'relative' },
  avatarEditOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  editForm: { width: '100%', gap: spacing.sm },
  editInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, color: colors.text, fontSize: fontSize.sm },
  editBio: { minHeight: 60, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
  saveBtn: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.accent, alignItems: 'center' },
  saveText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  profileInfo: { alignItems: 'center', gap: spacing.xs },
  displayName: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  bio: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 18 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: 'rgba(216,90,48,0.06)', borderRadius: borderRadius.md },
  linkText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '600', textDecorationLine: 'underline', maxWidth: 200 },
  actionRow: { marginTop: spacing.sm },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.accent, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg },
  followBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg,
  },
  editProfileText: { color: colors.accent, fontWeight: '700', fontSize: fontSize.sm },
  statsRow: { flexDirection: 'row', gap: spacing.xxl, paddingVertical: spacing.md },
  statItem: { alignItems: 'center' },
  statValue: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  creatorToggle: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg, width: '100%', justifyContent: 'center',
  },
  creatorText: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  tabTextActive: { color: colors.text },
});
