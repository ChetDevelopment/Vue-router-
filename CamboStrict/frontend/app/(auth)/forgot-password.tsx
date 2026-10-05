import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Shield } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { noOutline } from '../../src/stores/shared/constants';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!email.trim()) { setError('Enter your email'); return; }
    setLoading(true); setError('');
    try {
      await api.auth.forgotPassword(email);
      setStep('reset');
      Alert.alert('Code Sent', 'Check your email for a 6-digit reset code.');
    } catch (e: any) {
      setError(e.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!token.trim() || !newPassword.trim()) { setError('Fill all fields'); return; }
    if (newPassword.length < 12) { setError('Password must be at least 12 characters with uppercase, lowercase, number, and special character'); return; }
    setLoading(true); setError('');
    try {
      await api.auth.resetPassword(email, token, newPassword);
      setStep('done');
    } catch (e: any) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        {step === 'email' && (
          <>
            <View style={styles.iconWrap}><Mail size={24} color={colors.accent} /></View>
            <Text style={styles.heading}>Enter your email</Text>
            <Text style={styles.sub}>We'll send a 6-digit reset code</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="Email address" placeholderTextColor={colors.textMuted}
              keyboardType="email-address" autoCapitalize="none"
              style={[styles.input, noOutline]}
            />
            <TouchableOpacity onPress={handleSendCode} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}>
              {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.btnText}>Send Code</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === 'reset' && (
          <>
            <View style={styles.iconWrap}><Shield size={24} color={colors.accent} /></View>
            <Text style={styles.heading}>Enter reset code</Text>
            <Text style={styles.sub}>Check your email for the 6-digit code</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
              value={token} onChangeText={setToken}
              placeholder="6-digit code" placeholderTextColor={colors.textMuted}
              keyboardType="number-pad" maxLength={6}
              style={[styles.input, noOutline]}
            />
            <TextInput
              value={newPassword} onChangeText={setNewPassword}
              placeholder="New password (min 12 chars)" placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[styles.input, noOutline]}
            />
            <TouchableOpacity onPress={handleReset} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}>
              {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.btnText}>Reset Password</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === 'done' && (
          <>
            <View style={styles.iconWrap}><Shield size={24} color={colors.success} /></View>
            <Text style={styles.heading}>Password Reset!</Text>
            <Text style={styles.sub}>You can now log in with your new password.</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/welcome')} style={styles.btn}>
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  body: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(216,90,48,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: spacing.md },
  heading: { color: colors.text, fontWeight: '700', fontSize: fontSize.xl, textAlign: 'center' },
  sub: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
  error: { color: '#FF6B6B', fontSize: fontSize.sm, backgroundColor: 'rgba(255,107,107,0.1)', padding: spacing.md, borderRadius: borderRadius.lg, textAlign: 'center' },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.lg, padding: spacing.md + 2, color: colors.white, fontSize: fontSize.md },
  btn: { backgroundColor: colors.accent, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.sm },
  btnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
});
