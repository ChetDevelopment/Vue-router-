import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { noOutline } from '../../stores/shared/constants';

interface LoginStepProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string;
}

export function LoginStep({ onLogin, error }: LoginStepProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      await onLogin(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      <Text style={styles.sub}>Enter your email and password to log in</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email or Username"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.3)"
          secureTextEntry
          style={styles.input}
        />
      </View>
      <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={[styles.button, isSubmitting && { opacity: 0.6 }]}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Text style={styles.buttonText}>Log In</Text>
            <ArrowRight size={18} color={colors.white} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingBottom: 40 },
  title: { color: colors.white, fontWeight: '700', fontSize: 26, marginBottom: spacing.sm },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.sm, lineHeight: 20, marginBottom: 0 },
  error: { color: '#FF6B6B', fontSize: fontSize.sm, backgroundColor: 'rgba(255,107,107,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, marginTop: spacing.md },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.lg, padding: spacing.md + 2, color: colors.white, fontSize: fontSize.md },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.accent, paddingVertical: 16, borderRadius: borderRadius.lg, width: '100%', marginTop: spacing.lg },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
});
