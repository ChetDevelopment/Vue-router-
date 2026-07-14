import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { X, QrCode, CheckCircle, Award, Info, Sparkles } from 'lucide-react-native';
import { User } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { PAYMENT_PROVIDERS, PRESET_AMOUNTS } from '../../constants/data';

interface GiftingModalProps {
  creator: User;
  visible: boolean;
  onClose: () => void;
  onSuccess: (amount: string, provider: string) => void;
}

export function GiftingModal({ creator, visible, onClose, onSuccess }: GiftingModalProps) {
  const [step, setStep] = useState<'configure' | 'qr' | 'success'>('configure');
  const [selectedProvider, setSelectedProvider] = useState(PAYMENT_PROVIDERS[0]);
  const [currency, setCurrency] = useState<'KHR' | 'USD'>('KHR');
  const [selectedAmount, setSelectedAmount] = useState(PRESET_AMOUNTS[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [countdown, setCountdown] = useState(3);

  const getAmountStr = () => {
    if (customAmount) {
      return currency === 'KHR' ? `${parseInt(customAmount).toLocaleString()}៛` : `$${parseFloat(customAmount).toFixed(2)}`;
    }
    return currency === 'KHR' ? `${selectedAmount.riel.toLocaleString()}៛` : `$${selectedAmount.usd.toFixed(2)}`;
  };

  const handleConfirm = () => {
    setStep('qr');
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStep('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFinish = () => {
    onSuccess(getAmountStr(), selectedProvider.name);
    onClose();
    setStep('configure');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Creator Gifting</Text>
            <TouchableOpacity onPress={onClose}><X size={14} color={colors.textMuted} /></TouchableOpacity>
          </View>

          {step === 'configure' && (
            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
              <View style={styles.creatorCard}>
                <Avatar uri={creator.avatarUrl} size={44} isVerified={creator.isVerified} />
                <View>
                  <Text style={styles.creatorName}>@{creator.username}</Text>
                  <Text style={styles.creatorSub}>Support with KHQR payment</Text>
                </View>
              </View>

              <View style={styles.currencyRow}>
                <Text style={styles.label}>Currency</Text>
                <View style={styles.currencyToggle}>
                  <TouchableOpacity onPress={() => { setCurrency('KHR'); setCustomAmount(''); }} style={[styles.currencyOpt, currency === 'KHR' && styles.currencyActive]}>
                    <Text style={[styles.currencyText, currency === 'KHR' && styles.currencyTextActive]}>KHR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setCurrency('USD'); setCustomAmount(''); }} style={[styles.currencyOpt, currency === 'USD' && styles.currencyActive]}>
                    <Text style={[styles.currencyText, currency === 'USD' && styles.currencyTextActive]}>USD</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text style={styles.label}>Select Support Gift</Text>
                <View style={styles.amountGrid}>
                  {PRESET_AMOUNTS.map((p, i) => {
                    const isSel = selectedAmount === p && !customAmount;
                    const val = currency === 'KHR' ? `${p.riel.toLocaleString()}៛` : `$${p.usd.toFixed(2)}`;
                    return (
                      <TouchableOpacity key={i} onPress={() => { setSelectedAmount(p); setCustomAmount(''); }} style={[styles.amountCard, isSel && styles.amountActive]}>
                        <Text style={styles.amountIcon}>{p.icon}</Text>
                        <Text style={styles.amountValue}>{val}</Text>
                        <Text style={styles.amountLabel}>{p.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: spacing.xs }}>
                <Text style={styles.label}>Custom Amount</Text>
                <TextInput
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  placeholder={currency === 'KHR' ? 'e.g. 5000' : 'e.g. 5.00'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={styles.customInput}
                />
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text style={styles.label}>Payment App</Text>
                <View style={styles.providerGrid}>
                  {PAYMENT_PROVIDERS.map((p) => {
                    const isSel = selectedProvider.id === p.id;
                    return (
                      <TouchableOpacity key={p.id} onPress={() => setSelectedProvider(p)} style={[styles.providerCard, isSel && styles.providerActive]}>
                        <View style={[styles.providerLogo, { backgroundColor: p.logoBg }]}>
                          <Text style={styles.providerLogoText}>{p.id.toUpperCase().slice(0, 3)}</Text>
                        </View>
                        <Text style={styles.providerName}>{p.name}</Text>
                        <Text style={styles.providerBadge}>{p.badge}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.notice}>
                <Info size={13} color={colors.accent} />
                <Text style={styles.noticeText}>0% platform fee. 100% goes to creator via Bakong.</Text>
              </View>

              <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
                <QrCode size={14} color={colors.white} />
                <Text style={styles.confirmText}>Generate {selectedProvider.name} KHQR</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {step === 'qr' && (
            <View style={styles.qrContainer}>
              <Text style={styles.qrBadge}>KHQR Unified Payment</Text>
              <Text style={styles.qrAmount}>{getAmountStr()}</Text>
              <View style={styles.qrBox}>
                <View style={styles.qrPattern}>
                  <View style={styles.qrCode}>
                    <Text style={styles.qrPlaceholder}>KHQR</Text>
                    <Text style={styles.qrCodeText}>Scan with {selectedProvider.name}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.qrCreator}>@{creator.username}</Text>
              <Text style={styles.qrCountdown}>Auto-completes in {countdown}s</Text>
              <View style={styles.qrActions}>
                <TouchableOpacity onPress={() => setStep('configure')} style={styles.backBtn}>
                  <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setStep('success'); }} style={styles.passBtn}>
                  <Text style={styles.passText}>Instant Pass (Test)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <CheckCircle size={32} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Transaction Confirmed</Text>
              <Text style={styles.successSub}>Gift Sent Successfully!</Text>
              <Text style={styles.successDetail}>
                Transferred <Text style={styles.successAmount}>{getAmountStr()}</Text> via {selectedProvider.name} to @{creator.username}
              </Text>
              <View style={styles.receipt}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>App</Text>
                  <Text style={styles.receiptValue}>{selectedProvider.name}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>To</Text>
                  <Text style={styles.receiptValue}>@{creator.username}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Amount</Text>
                  <Text style={[styles.receiptValue, { fontFamily: 'monospace' }]}>{getAmountStr()}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Fee</Text>
                  <Text style={[styles.receiptValue, { color: colors.success }]}>0៛ (FREE)</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleFinish} style={styles.finishBtn}>
                <Text style={styles.finishText}>Close & Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xxl, maxHeight: '90%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.text, fontWeight: '800', fontSize: fontSize.sm, textTransform: 'uppercase' },
  creatorCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border },
  creatorName: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  creatorSub: { color: colors.textMuted, fontSize: fontSize.xs },
  currencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.xs, textTransform: 'uppercase' },
  currencyToggle: { flexDirection: 'row', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: 2 },
  currencyOpt: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.sm },
  currencyActive: { backgroundColor: colors.accent },
  currencyText: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  currencyTextActive: { color: colors.white },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amountCard: { width: '47%', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing.md, gap: 4 },
  amountActive: { borderColor: colors.accent, backgroundColor: 'rgba(216,90,48,0.1)' },
  amountIcon: { fontSize: 20 },
  amountValue: { color: colors.text, fontWeight: '800', fontSize: fontSize.sm },
  amountLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  customInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, color: colors.text, fontSize: fontSize.sm },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  providerCard: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.sm },
  providerActive: { borderColor: colors.accent, backgroundColor: 'rgba(255,255,255,0.05)' },
  providerLogo: { width: 24, height: 24, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  providerLogoText: { color: colors.white, fontWeight: '800', fontSize: 9 },
  providerName: { color: colors.text, fontWeight: '700', fontSize: fontSize.xs },
  providerBadge: { color: colors.textMuted, fontSize: 8 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: 'rgba(216,90,48,0.05)', borderWidth: 1, borderColor: 'rgba(216,90,48,0.15)', padding: spacing.md, borderRadius: borderRadius.xl },
  noticeText: { color: colors.textMuted, fontSize: fontSize.xs, flex: 1 },
  confirmBtn: { flexDirection: 'row', backgroundColor: colors.accent, paddingVertical: spacing.md, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  qrContainer: { padding: spacing.xl, alignItems: 'center', gap: spacing.lg },
  qrBadge: { color: colors.danger, fontSize: 9, fontWeight: '700', backgroundColor: 'rgba(226,75,74,0.1)', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 9999, overflow: 'hidden' },
  qrAmount: { color: colors.text, fontWeight: '800', fontSize: fontSize.xl },
  qrBox: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.xl, alignItems: 'center', width: 220 },
  qrPattern: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(6,61,111,0.2)', padding: spacing.lg, borderRadius: borderRadius.md, width: '100%', alignItems: 'center' },
  qrCode: { alignItems: 'center', gap: spacing.sm },
  qrPlaceholder: { color: '#063D6F', fontWeight: '900', fontSize: 18 },
  qrCodeText: { color: '#666', fontSize: fontSize.xs },
  qrCreator: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  qrCountdown: { color: colors.textMuted, fontSize: fontSize.xs },
  qrActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  backBtn: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  backText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
  passBtn: { flex: 1, backgroundColor: colors.success, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  passText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  successContainer: { padding: spacing.xl, alignItems: 'center', gap: spacing.lg },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(99,153,34,0.15)', borderWidth: 1, borderColor: 'rgba(99,153,34,0.3)', justifyContent: 'center', alignItems: 'center' },
  successTitle: { color: colors.success, fontWeight: '800', fontSize: fontSize.xs, textTransform: 'uppercase' },
  successSub: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  successDetail: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  successAmount: { color: colors.text, fontWeight: '700' },
  receipt: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', gap: spacing.sm },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  receiptValue: { color: colors.text, fontWeight: '600', fontSize: fontSize.xs },
  finishBtn: { backgroundColor: colors.success, paddingVertical: spacing.md, borderRadius: borderRadius.lg, width: '100%', alignItems: 'center' },
  finishText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
});
