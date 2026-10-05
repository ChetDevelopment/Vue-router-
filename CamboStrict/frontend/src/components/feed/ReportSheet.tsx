import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { noOutline } from '../../stores/shared/constants';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', emoji: '📧' },
  { id: 'harassment', label: 'Harassment or bullying', emoji: '⚠️' },
  { id: 'nudity', label: 'Nudity or sexual content', emoji: '🔞' },
  { id: 'violence', label: 'Violence or harmful content', emoji: '🚫' },
  { id: 'hate_speech', label: 'Hate speech', emoji: '🗣️' },
  { id: 'copyright', label: 'Copyright infringement', emoji: '©️' },
  { id: 'other', label: 'Other', emoji: '📝' },
];

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ReportSheet({ visible, onClose, onSubmit }: ReportSheetProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = () => {
    const reason = selectedReason === 'other' ? customReason : selectedReason;
    if (!reason) return;
    onSubmit(reason);
    setSelectedReason(null);
    setCustomReason('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Post</Text>
            <TouchableOpacity onPress={onClose}><X size={18} color={colors.textMuted} /></TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Why are you reporting this post?</Text>

          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason.id;
            return (
              <TouchableOpacity
                key={reason.id}
                onPress={() => setSelectedReason(reason.id)}
                style={[styles.reasonRow, isSelected && styles.reasonRowActive]}
              >
                <Text style={{ fontSize: 18 }}>{reason.emoji}</Text>
                <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>{reason.label}</Text>
                {isSelected && <View style={styles.checkmark}><Text style={styles.checkmarkText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}

          {selectedReason === 'other' && (
            <TextInput
              value={customReason}
              onChangeText={setCustomReason}
              placeholder="Describe the issue..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.customInput, noOutline]}
            />
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim())}
            style={[styles.submitBtn, !selectedReason && styles.submitBtnDisabled]}
          >
            <Text style={styles.submitText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, padding: spacing.lg, paddingBottom: spacing.md },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, marginHorizontal: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.xs },
  reasonRowActive: { backgroundColor: 'rgba(216,90,48,0.1)' },
  reasonText: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm, flex: 1 },
  reasonTextActive: { color: colors.accent },
  checkmark: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  checkmarkText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  customInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, color: colors.text, fontSize: fontSize.sm, minHeight: 60, marginHorizontal: spacing.lg, marginVertical: spacing.md, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.accent, marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.sm },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
});
