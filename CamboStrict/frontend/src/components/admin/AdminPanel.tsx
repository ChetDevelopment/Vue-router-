import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ShieldAlert, EyeOff, Check, AlertOctagon, Users, Video, RefreshCw } from 'lucide-react-native';
import { api } from '../../api/client';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { formatCount } from '../../utils/format';

interface AdminPanelProps {
  postCount: number;
  onClose: () => void;
}

export function AdminPanel({ postCount, onClose }: AdminPanelProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [kpi, setKpi] = useState<{ dau: number; flaggedItems: number; publishedPosts: number } | null>(null);
  const [reportsTotal, setReportsTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsData, auditData, kpiData] = await Promise.all([
        api.reports.list(1),
        api.admin.auditLog(1),
        api.admin.kpi(),
      ]);
      setReports(reportsData.reports || []);
      setReportsTotal(reportsData.total || 0);
      setAuditLog(auditData.actions || []);
      setKpi(kpiData);
    } catch (e) { console.error(e); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (report: any, actionType: string) => {
    setActionLoading(report.id);
    try {
      await api.reports.action(report.id, actionType);
      const msg: Record<string, string> = {
        remove_post: 'Post removed',
        warn_user: 'Warning issued to creator',
        suspend_user: 'Account suspended',
        dismiss: 'Report dismissed',
      };
      Alert.alert('Success', msg[actionType] || 'Action completed');
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      setSelectedId(null);
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to perform action. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !kpi) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShieldAlert size={16} color={colors.accent} />
        <Text style={styles.title}>Trust & Safety Console</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.exitBtn}>Exit Admin</Text></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
        <View style={styles.kpiRow}>
          <KpiCard icon={Users} value={kpi ? formatCount(kpi.dau) : '--'} label="DAU (last 24h)" color={colors.accent} />
          <KpiCard icon={ShieldAlert} value={kpi ? `${kpi.flaggedItems} pending` : '--'} label="Flagged items" color={colors.danger} />
          <KpiCard icon={Video} value={kpi ? formatCount(kpi.publishedPosts) : '--'} label="Published" color={colors.success} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reported Queue ({reportsTotal})</Text>
          <TouchableOpacity onPress={fetchData}><RefreshCw size={14} color={colors.accent} /></TouchableOpacity>
        </View>

        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Safety Queue Cleared!</Text>
            <Text style={styles.emptySub}>All reports have been reviewed.</Text>
          </View>
        ) : (
          reports.map((rep) => (
            <TouchableOpacity key={rep.id} onPress={() => setSelectedId(selectedId === rep.id ? null : rep.id)} style={[styles.reportCard, selectedId === rep.id && styles.reportActive]}>
              <View style={styles.reportHeader}>
                <Text style={styles.reasonBadge}>REASON: {(rep.reason || '').toUpperCase()}</Text>
                <Text style={styles.pendingBadge}>Pending</Text>
              </View>
              <Text style={styles.reporter}>Flagged by @{rep.reporterUsername}</Text>
              <Text style={styles.excerpt} numberOfLines={2}>"{rep.targetExcerpt || 'No excerpt'}"</Text>

              {selectedId === rep.id && (
                <View style={styles.actionPanel}>
                  <View style={styles.actionGrid}>
                    <TouchableOpacity
                      onPress={() => handleAction(rep, 'dismiss')}
                      style={styles.dismissBtn}
                      disabled={actionLoading === rep.id}>
                      {actionLoading === rep.id ? <ActivityIndicator size="small" color={colors.textMuted} /> : <Check size={11} color={colors.textMuted} />}
                      <Text style={styles.dismissText}>Dismiss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAction(rep, 'remove_post')}
                      style={styles.hideBtn}
                      disabled={actionLoading === rep.id}>
                      {actionLoading === rep.id ? <ActivityIndicator size="small" color={colors.danger} /> : <EyeOff size={11} color={colors.danger} />}
                      <Text style={styles.hideText}>Remove Post</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAction(rep, 'warn_user')}
                      style={styles.warnBtn}
                      disabled={actionLoading === rep.id}>
                      {actionLoading === rep.id ? <ActivityIndicator size="small" color={colors.accent} /> : <AlertOctagon size={11} color={colors.accent} />}
                      <Text style={styles.warnText}>Warn Creator</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAction(rep, 'suspend_user')}
                      style={styles.suspendBtn}
                      disabled={actionLoading === rep.id}>
                      {actionLoading === rep.id ? <ActivityIndicator size="small" color={colors.danger} /> : <ShieldAlert size={11} color={colors.danger} />}
                      <Text style={styles.suspendText}>Suspend User</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.sectionTitle}>Moderation Audit Log</Text>
          <View style={styles.auditBox}>
            {auditLog.length === 0 ? (
              <Text style={styles.auditEmpty}>No moderation actions recorded.</Text>
            ) : (
              auditLog.map((log) => (
                <View key={log.id} style={styles.auditItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.auditAction}>{log.action?.replace(/_/g, ' ')?.replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
                    <Text style={styles.auditModerator}>by @{log.moderator_username}</Text>
                    <Text style={styles.auditTarget} numberOfLines={1}>{log.reason || 'No reason'}</Text>
                  </View>
                  <Text style={styles.auditTime}>{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function KpiCard({ icon: Icon, value, label, color }: { icon: React.ComponentType<{ size?: number; color?: string }>; value: string; label: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 }}>
        <Icon size={12} color={color} />
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.md, flex: 1, marginLeft: spacing.sm },
  exitBtn: { color: colors.accent, fontWeight: '700', fontSize: fontSize.sm },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  kpiLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700', textTransform: 'uppercase' },
  kpiValue: { fontSize: fontSize.sm, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  emptyState: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  emptySub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  reportCard: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.sm },
  reportActive: { borderColor: colors.accent },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reasonBadge: { color: colors.danger, fontSize: 9, fontWeight: '700', backgroundColor: 'rgba(226,75,74,0.1)', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  pendingBadge: { color: colors.textMuted, fontSize: 9 },
  reporter: { color: colors.textMuted, fontSize: fontSize.xs },
  excerpt: { color: colors.text, fontSize: fontSize.sm, backgroundColor: colors.bg, padding: spacing.sm, borderRadius: borderRadius.md, fontStyle: 'italic' },
  actionPanel: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.md },
  actionGrid: { flexDirection: 'row', gap: spacing.sm },
  dismissBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dismissText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  hideBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(226,75,74,0.1)', borderWidth: 1, borderColor: 'rgba(226,75,74,0.2)', padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', gap: 4 },
  hideText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: '700' },
  warnBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(216,90,48,0.1)', borderWidth: 1, borderColor: 'rgba(216,90,48,0.2)', padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', gap: 4 },
  warnText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700' },
  suspendBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(226,75,74,0.1)', borderWidth: 1, borderColor: 'rgba(226,75,74,0.2)', padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', gap: 4 },
  suspendText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: '700' },
  auditBox: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing.md },
  auditEmpty: { color: colors.textMuted, fontSize: fontSize.sm, fontStyle: 'italic' },
  auditItem: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm, gap: spacing.sm },
  auditAction: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm, textTransform: 'capitalize' },
  auditModerator: { color: colors.textMuted, fontSize: fontSize.xs },
  auditTarget: { color: colors.textMuted, fontSize: fontSize.xs },
  auditTime: { color: colors.textMuted, fontSize: 9 },
});
