import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ShieldAlert, EyeOff, Check, AlertOctagon, Users, Video } from 'lucide-react-native';
import { Report, ReportAction } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

interface AdminPanelProps {
  reports: Report[];
  postCount: number;
  onActionReport: (reportId: string, action: 'hide_post' | 'warn_user' | 'suspend_user' | 'dismiss') => void;
  onClose: () => void;
}

export function AdminPanel({ reports, postCount, onActionReport, onClose }: AdminPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<ReportAction[]>([]);

  const handleAction = (report: Report, actionType: 'hide_post' | 'warn_user' | 'suspend_user' | 'dismiss') => {
    onActionReport(report.id, actionType);
    const labels: Record<string, string> = {
      hide_post: 'Removed Post',
      warn_user: 'Issued Warning',
      suspend_user: 'Suspended Account',
      dismiss: 'Dismissed Report',
    };
    setActionLog((prev) => [
      { id: Math.random().toString(), target: report.targetExcerpt || report.targetId, action: labels[actionType], time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
    setSelectedId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShieldAlert size={16} color={colors.accent} />
        <Text style={styles.title}>Trust & Safety Console</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.exitBtn}>Exit Admin</Text></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
        <View style={styles.kpiRow}>
          <KpiCard icon={Users} value="14,240" label="Est. DAU" color={colors.accent} />
          <KpiCard icon={ShieldAlert} value={`${reports.length} pending`} label="Flagged items" color={colors.danger} />
          <KpiCard icon={Video} value={`${postCount} clips`} label="Published" color={colors.success} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.sectionTitle}>Reported Queue</Text>
          {reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Safety Queue Cleared!</Text>
              <Text style={styles.emptySub}>No pending flagged content.</Text>
            </View>
          ) : (
            reports.map((rep) => (
              <TouchableOpacity key={rep.id} onPress={() => setSelectedId(selectedId === rep.id ? null : rep.id)} style={[styles.reportCard, selectedId === rep.id && styles.reportActive]}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reasonBadge}>REASON: {rep.reason.toUpperCase()}</Text>
                  <Text style={styles.pendingBadge}>Pending</Text>
                </View>
                <Text style={styles.reporter}>Flagged by @{rep.reporterUsername}</Text>
                <Text style={styles.excerpt} numberOfLines={2}>"{rep.targetExcerpt}"</Text>

                {selectedId === rep.id && (
                  <View style={styles.actionPanel}>
                    <View style={styles.actionGrid}>
                      <TouchableOpacity onPress={() => handleAction(rep, 'dismiss')} style={styles.dismissBtn}>
                        <Check size={11} color={colors.textMuted} />
                        <Text style={styles.dismissText}>Dismiss</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleAction(rep, 'hide_post')} style={styles.hideBtn}>
                        <EyeOff size={11} color={colors.danger} />
                        <Text style={styles.hideText}>Remove Post</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleAction(rep, 'warn_user')} style={styles.warnBtn}>
                        <AlertOctagon size={11} color={colors.accent} />
                        <Text style={styles.warnText}>Warn Creator</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.sectionTitle}>Live Safety Audit Logs</Text>
          <View style={styles.auditBox}>
            {actionLog.length === 0 ? (
              <Text style={styles.auditEmpty}>No moderation actions performed.</Text>
            ) : (
              actionLog.map((log) => (
                <View key={log.id} style={styles.auditItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.auditAction}>{log.action}</Text>
                    <Text style={styles.auditTarget} numberOfLines={1}>{log.target}</Text>
                  </View>
                  <Text style={styles.auditTime}>{log.time}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function KpiCard({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
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
  auditBox: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing.md },
  auditEmpty: { color: colors.textMuted, fontSize: fontSize.sm, fontStyle: 'italic' },
  auditItem: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm, gap: spacing.sm },
  auditAction: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  auditTarget: { color: colors.textMuted, fontSize: fontSize.xs },
  auditTime: { color: colors.textMuted, fontSize: 9 },
});
