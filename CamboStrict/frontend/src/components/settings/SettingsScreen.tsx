import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, TextInput, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { User } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { Bell, Lock, User as UserIcon, Shield, Eye, Database, Monitor, HelpCircle, Trash2, LogOut, ChevronRight, Globe, Moon } from 'lucide-react-native';
import { noOutline } from '../../stores/shared/constants';
import { api } from '../../api/client';

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentUser, updateProfile, updateRole, logout, blockedUsers, unblockUser } = useAuthStore();

  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [link, setLink] = useState(currentUser?.link || '');
  const [blockedDetails, setBlockedDetails] = useState<any[]>([]);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteInput, setShowDeleteInput] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);

  useEffect(() => {
    if (blockedUsers.length > 0) {
      api.users.getBlocked().then(setBlockedDetails).catch(() => {});
    }
  }, [blockedUsers.length]);

  useEffect(() => {
    api.settings.getPreferences().then(setPreferences).catch(() => {});
  }, []);

  const updatePreference = (key: string, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    api.settings.updatePreferences({ [key]: value }).catch(() => {});
  };

  if (!currentUser) return null;

  const { lang, setLanguage } = useLanguage();
  const [saveError, setSaveError] = useState('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportText, setReportText] = useState('');

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ displayName, bio, link });
      setEditingProfile(false);
      setSaveError('');
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.doneBtn}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {editingProfile ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor={colors.textMuted}
              style={[styles.editInput, noOutline]}
            />
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.editInput, styles.editBio, noOutline]}
            />
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="Link"
              placeholderTextColor={colors.textMuted}
              style={[styles.editInput, noOutline]}
            />
            {saveError ? <Text style={[styles.settingHint, { color: colors.danger, marginTop: spacing.xs }]}>{saveError}</Text> : null}
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setEditingProfile(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <TouchableOpacity onPress={() => setEditingProfile(true)} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <UserIcon size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Edit Profile</Text>
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={[styles.settingRow, { opacity: 0.5 }]}>
            <View style={styles.settingLeft}>
              <Lock size={16} color={colors.textMuted} />
              <Text style={[styles.settingLabel, { color: colors.textMuted }]}>Two-Factor Authentication</Text>
            </View>
            <Text style={styles.settingHint}>Coming soon</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Eye size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Private Account</Text>
            </View>
            <Switch
              value={currentUser.isPrivate}
              onValueChange={(v) => updateProfile({ isPrivate: v })}
              trackColor={{ false: colors.bgLight, true: colors.accent + '80' }}
              thumbColor={currentUser.isPrivate ? colors.accent : colors.textMuted}
            />
          </View>
            {currentUser && blockedUsers.length > 0 && (
              <View style={styles.blockedSection}>
                <Text style={styles.blockedTitle}>Blocked Users ({blockedUsers.length})</Text>
                {blockedDetails.map((user: any) => (
                  <View key={user.id} style={styles.blockedRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.blockedName}>{user.displayName || `@${user.username}`}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>@{user.username}</Text>
                    </View>
                    <TouchableOpacity onPress={() => unblockUser(user.id)}>
                      <Text style={styles.unblockBtn}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Push — Likes</Text>
            </View>
            <Switch
              value={preferences?.pushLikes ?? true}
              onValueChange={(v) => updatePreference('pushLikes', v)}
              trackColor={{ false: colors.bgLight, true: colors.accent + '80' }}
              thumbColor={preferences?.pushLikes ? colors.accent : colors.textMuted}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Push — Comments</Text>
            </View>
            <Switch
              value={preferences?.pushComments ?? true}
              onValueChange={(v) => updatePreference('pushComments', v)}
              trackColor={{ false: colors.bgLight, true: colors.accent + '80' }}
              thumbColor={preferences?.pushComments ? colors.accent : colors.textMuted}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Push — Follows</Text>
            </View>
            <Switch
              value={preferences?.pushFollows ?? true}
              onValueChange={(v) => updatePreference('pushFollows', v)}
              trackColor={{ false: colors.bgLight, true: colors.accent + '80' }}
              thumbColor={preferences?.pushFollows ? colors.accent : colors.textMuted}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Push — Messages</Text>
            </View>
            <Switch
              value={preferences?.pushMessages ?? true}
              onValueChange={(v) => updatePreference('pushMessages', v)}
              trackColor={{ false: colors.bgLight, true: colors.accent + '80' }}
              thumbColor={preferences?.pushMessages ? colors.accent : colors.textMuted}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Content & Display</Text>
        <View style={styles.section}>
          <TouchableOpacity onPress={async () => {
            try {
              if (Platform.OS !== 'web') {
                const FileSystem = await import('expo-file-system');
                await FileSystem.deleteAsync((FileSystem as any).cacheDirectory, { idempotent: true });
              }
              Alert.alert('Cache cleared', 'Temporary files and cached data have been removed.');
            } catch (e: any) {
              Alert.alert('Failed to clear cache', e?.message || 'An error occurred while clearing the cache.');
            }
          }} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Database size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Clear Cache</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Moon size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Text style={[styles.settingHint, { color: colors.success }]}>Always on</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Language / ភាសា</Text>
        <View style={styles.section}>
          <TouchableOpacity onPress={() => setLanguage(lang === 'en' ? 'kh' : 'en')} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Globe size={16} color={colors.text} />
              <Text style={styles.settingLabel}>
                {lang === 'en' ? 'ភាសាខ្មែរ' : 'English'}
              </Text>
            </View>
            <Text style={[styles.settingHint, { color: colors.accent }]}>
              {lang === 'en' ? 'ប្តូរទៅជាភាសាខ្មែរ' : 'Switch to Khmer'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Creator</Text>
        <View style={styles.section}>
          <TouchableOpacity onPress={() => updateRole(currentUser.role === 'creator' ? 'user' : 'creator')} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Monitor size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Creator Mode</Text>
            </View>
            <Text style={[styles.settingHint, currentUser.isCreator && { color: colors.success }]}>
              {currentUser.isCreator ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.section}>
          <TouchableOpacity onPress={() => { setReportText(''); setReportModalVisible(true); }} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <HelpCircle size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Report a Problem</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Community Guidelines',
              'TokLok Cambodia is committed to providing a safe and respectful community.\n\n' +
              '• Respect others — no harassment, bullying, or hate speech\n' +
              '• Post appropriate content — no nudity, violence, or illegal activities\n' +
              '• Respect intellectual property — only post content you own\n' +
              '• No spam, misleading content, or impersonation\n' +
              '• Users under 13 must have parental consent\n\n' +
              'Violations may result in content removal, account suspension, or permanent ban.\n\n' +
              'For more details, visit toklok.kh/guidelines'
            );
          }} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Globe size={16} color={colors.text} />
              <Text style={styles.settingLabel}>Community Guidelines</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Account Actions</Text>
        <View style={styles.section}>
          <TouchableOpacity onPress={() => Alert.alert(
            'Deactivate Account',
            'Your profile will be hidden. You can reactivate by logging in again.',
            [{ text: 'Cancel', style: 'cancel' }, { text: 'Deactivate', style: 'destructive', onPress: async () => {
                try {
                  await api.account.deactivate();
                  logout();
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Failed to deactivate account. Please try again.');
                }
            }}]
          )} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Eye size={16} color={colors.danger} />
              <Text style={[styles.settingLabel, { color: colors.danger }]}>Deactivate Account</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (Alert.prompt) {
                Alert.prompt(
                  'Delete Account',
                  'Enter your password to confirm permanent deletion:\n\nThis action cannot be undone.',
                  async (password) => {
                    if (!password) return;
                    try {
                      await api.account.delete(password);
                      logout();
                    } catch {
                      Alert.alert('Error', 'Wrong password. Deletion failed.');
                    }
                  }
                );
              } else {
                setShowDeleteInput(true);
              }
            }}
            style={styles.settingRow}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={16} color={colors.danger} />
              <Text style={[styles.settingLabel, { color: colors.danger }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
          {showDeleteInput && (
            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              <TextInput
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Enter your password to confirm"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={[styles.editInput, noOutline]}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity onPress={() => { setShowDeleteInput(false); setDeletePassword(''); }} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  if (!deletePassword) return;
                  try {
                    await api.account.delete(deletePassword);
                    logout();
                  } catch {
                    Alert.alert('Error', 'Wrong password. Deletion failed.');
                    setDeletePassword('');
                  }
                }} style={[styles.saveBtn, { backgroundColor: colors.danger }]}>
                  <Text style={[styles.saveText, { color: colors.white }]}>Confirm Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Log Out', 'Are you sure you want to log out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log Out', style: 'destructive', onPress: () => logout() }])}
          style={styles.logoutBtn}
        >
          <LogOut size={16} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>TokLok Cambodia v2.0.0</Text>
      </ScrollView>

      <Modal visible={reportModalVisible} transparent animationType="fade" onRequestClose={() => setReportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report a Problem</Text>
            <TextInput
              value={reportText}
              onChangeText={setReportText}
              placeholder="Describe the issue you encountered..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.reportInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                if (!reportText.trim()) return;
                try {
                  await api.reports.create({ targetType: 'user', targetId: currentUser.id, reason: reportText });
                  setReportModalVisible(false);
                  Alert.alert('Thank you', 'Your report has been submitted.');
                } catch {
                  Alert.alert('Error', 'Failed to submit report. Please try again.');
                }
              }} style={styles.saveBtn}>
                <Text style={styles.saveText}>Submit</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontWeight: '800', fontSize: fontSize.md },
  doneBtn: { color: colors.accent, fontWeight: '700', fontSize: fontSize.sm },
  content: { paddingBottom: spacing.xxxl * 3 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  settingLabel: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  settingHint: { color: colors.textMuted, fontSize: fontSize.sm },
  blockedSection: { padding: spacing.lg, gap: spacing.sm },
  blockedTitle: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.xs },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
  },
  blockedName: { color: colors.text, fontSize: fontSize.sm },
  unblockBtn: { color: colors.danger, fontWeight: '600', fontSize: fontSize.sm },
  editInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.sm,
  },
  editBio: { height: 80, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: fontSize.sm },
  version: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  reportInput: {
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    height: 120,
    textAlignVertical: 'top',
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
