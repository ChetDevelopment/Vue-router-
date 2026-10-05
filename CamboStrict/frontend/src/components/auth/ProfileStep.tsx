import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, ArrowRight } from 'lucide-react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { noOutline } from '../../stores/shared/constants';

interface ProfileStepProps {
  onNext: (username: string, displayName: string) => void;
  error: string;
}

export function ProfileStep({ onNext, error }: ProfileStepProps) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Profile</Text>
      <Text style={styles.sub}>Choose your username and display name.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display Name" placeholderTextColor="rgba(255,255,255,0.3)" maxLength={30} style={styles.input} />
        <TextInput value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor="rgba(255,255,255,0.3)" autoCapitalize="none" maxLength={20} style={styles.input} />
        <TouchableOpacity onPress={() => setAgeChecked(!ageChecked)} style={styles.checkRow}>
          <View style={[styles.checkbox, ageChecked && styles.checkboxOn]}>
            {ageChecked && <Check size={10} color={colors.white} />}
          </View>
          <Text style={styles.checkLabel}>I am at least 13 years old</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTermsChecked(!termsChecked)} style={styles.checkRow}>
          <View style={[styles.checkbox, termsChecked && styles.checkboxOn]}>
            {termsChecked && <Check size={10} color={colors.white} />}
          </View>
          <Text style={styles.checkLabel}>Accept Terms of Service</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => onNext(username, displayName)} style={styles.button}>
        <Text style={styles.buttonText}>Next</Text>
        <ArrowRight size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingBottom: 40 },
  title: { color: colors.white, fontWeight: '700', fontSize: 26, marginBottom: spacing.sm },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.sm, lineHeight: 20 },
  error: { color: '#FF6B6B', fontSize: fontSize.sm, backgroundColor: 'rgba(255,107,107,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, marginTop: spacing.md },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.lg, padding: spacing.md + 2, color: colors.white, fontSize: fontSize.md },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.accent, paddingVertical: 16, borderRadius: borderRadius.lg, width: '100%', marginTop: spacing.lg },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkLabel: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.sm, flex: 1 },
});
