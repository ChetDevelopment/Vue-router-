import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Smartphone, Mail, Lock, CheckCircle2, ArrowRight, Check } from 'lucide-react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { INTEREST_CATEGORIES } from '../../src/constants/data';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';

export default function WelcomeScreen() {
  const { setCurrentUser } = useAuthStore();
  const [step, setStep] = useState<'welcome' | 'auth' | 'otp' | 'profile' | 'interests'>('welcome');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleComplete = () => {
    if (selectedInterests.length < 2) {
      setError('Select at least 2 interests');
      return;
    }
    const newUser = {
      id: `user_${Math.random()}`,
      username: username.toLowerCase(),
      displayName,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300',
      bio: `I love ${selectedInterests.join(', ')}!`,
      isPrivate: false, isCreator: false, isVerified: false,
      role: 'user' as const, status: 'active' as const,
      createdAt: new Date().toISOString(),
      followerCount: 0, followingCount: selectedInterests.length, totalLikesReceived: 0,
    };
    setCurrentUser(newUser);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {step === 'welcome' && (
            <View style={styles.welcomeSection}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>TL</Text>
              </View>
              <Text style={styles.title}>TokLok</Text>
              <Text style={styles.subtitle}>Cambodia's Short-Video Platform</Text>

              <TouchableOpacity onPress={() => { setAuthMethod('phone'); setStep('auth'); }} style={[styles.btn, styles.btnPrimary]}>
                <Smartphone size={18} color={colors.white} />
                <Text style={styles.btnPrimaryText}>Continue with Phone</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAuthMethod('email'); setStep('auth'); }} style={[styles.btn, styles.btnSecondary]}>
                <Mail size={18} color={colors.text} />
                <Text style={styles.btnSecondaryText}>Continue with Email</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or Social Login</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                {['Google', 'Facebook', 'Apple'].map((name) => (
                  <TouchableOpacity key={name} onPress={() => {
                    setUsername(`${name.toLowerCase()}_user`);
                    setDisplayName(`${name} User`);
                    setAgeChecked(true);
                    setTermsChecked(true);
                    setStep('interests');
                  }} style={styles.socialBtn}>
                    <Text style={styles.socialText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 'auth' && (
            <View>
              <Text style={styles.authTitle}>Create Account</Text>
              <Text style={styles.authSub}>{authMethod === 'phone' ? 'Enter your phone number' : 'Enter email and password'}</Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {authMethod === 'phone' ? (
                <View style={{ gap: spacing.md }}>
                  <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" style={styles.input} />
                </View>
              ) : (
                <View style={{ gap: spacing.md }}>
                  <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} keyboardType="email-address" style={styles.input} />
                  <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.textMuted} secureTextEntry style={styles.input} />
                </View>
              )}

              <View style={styles.authActions}>
                <TouchableOpacity onPress={() => setStep('welcome')} style={[styles.btn, styles.btnSecondary, { flex: 1 }]}>
                  <Text style={styles.btnSecondaryText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setStep('profile'); setError(''); }} style={[styles.btn, styles.btnPrimary, { flex: 1 }]}>
                  <Text style={styles.btnPrimaryText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'profile' && (
            <View>
              <Text style={styles.authTitle}>Set Up Profile</Text>
              <Text style={styles.authSub}>Choose your username and display name.</Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={{ gap: spacing.md }}>
                <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display Name" placeholderTextColor={colors.textMuted} style={styles.input} />
                <TextInput value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor={colors.textMuted} autoCapitalize="none" style={styles.input} />

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

              <TouchableOpacity onPress={() => { if (!username || !displayName) { setError('Fill all fields'); return; } setStep('interests'); }} style={[styles.btn, styles.btnPrimary, { marginTop: spacing.xl }]}>
                <Text style={styles.btnPrimaryText}>Next</Text>
                <ArrowRight size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {step === 'interests' && (
            <View>
              <Text style={styles.authTitle}>Pick Interests</Text>
              <Text style={styles.authSub}>Select at least 2 to personalize your feed.</Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.interestGrid}>
                {INTEREST_CATEGORIES.map((cat) => {
                  const selected = selectedInterests.includes(cat.id);
                  return (
                    <TouchableOpacity key={cat.id} onPress={() => toggleInterest(cat.id)} style={[styles.interestCard, selected && styles.interestActive]}>
                      <Text style={[styles.interestText, selected && styles.interestTextActive]}>{cat.label}</Text>
                      {selected && <CheckCircle2 size={14} color={colors.accent} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.interestCount}>Selected: {selectedInterests.length}</Text>

              <TouchableOpacity onPress={handleComplete} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Let's TokLok!</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xxl, padding: spacing.xl },
  welcomeSection: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  logoBox: { width: 64, height: 64, backgroundColor: colors.accent, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: colors.white, fontWeight: '900', fontSize: 24 },
  title: { color: colors.text, fontWeight: '700', fontSize: 28 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.md },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm },
  btnPrimary: { backgroundColor: colors.accent },
  btnPrimaryText: { color: colors.white, fontWeight: '600', fontSize: fontSize.md },
  btnSecondary: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: fontSize.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  socialRow: { flexDirection: 'row', gap: spacing.sm },
  socialBtn: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  socialText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  authTitle: { color: colors.text, fontWeight: '700', fontSize: 22, marginBottom: spacing.xs },
  authSub: { color: colors.textMuted, fontSize: fontSize.md, marginBottom: spacing.lg },
  error: { color: colors.danger, fontSize: fontSize.sm, backgroundColor: 'rgba(226,75,74,0.1)', borderWidth: 1, borderColor: 'rgba(226,75,74,0.2)', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, color: colors.text, fontSize: fontSize.md },
  authActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkLabel: { color: colors.textMuted, fontSize: fontSize.sm, flex: 1 },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  interestCard: { width: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, borderRadius: borderRadius.lg },
  interestActive: { borderColor: colors.accent, backgroundColor: 'rgba(216,90,48,0.1)' },
  interestText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  interestTextActive: { color: colors.accent },
  interestCount: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginVertical: spacing.md },
});
