import { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, BackHandler, Alert, ActivityIndicator, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, X, Smartphone, Mail, CheckCircle2, Check, ChevronDown } from 'lucide-react-native';
import { GoogleIcon, FacebookIcon, AppleIcon } from '../../src/components/ui/BrandIcons';
import { AppLogoMark } from '../../src/components/ui/AppLogo';
import { Avatar } from '../../src/components/ui/Avatar';
import { useAuthStore } from '../../src/stores/authStore';
import { usePostStore } from '../../src/stores/postStore';
import { INTEREST_CATEGORIES } from '../../src/constants/data';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { noOutline } from '../../src/stores/shared/constants';
import { WelcomeHero } from '../../src/components/auth/WelcomeHero';
import { LoginStep } from '../../src/components/auth/LoginStep';
import { ProfileStep } from '../../src/components/auth/ProfileStep';
import { InterestsStep } from '../../src/components/auth/InterestsStep';

const COUNTRY_CODES = [
  { code: '+855', label: 'KH', country: 'Cambodia' },
  { code: '+84', label: 'VN', country: 'Vietnam' },
  { code: '+66', label: 'TH', country: 'Thailand' },
  { code: '+86', label: 'CN', country: 'China' },
  { code: '+1', label: 'US', country: 'United States' },
  { code: '+44', label: 'GB', country: 'United Kingdom' },
  { code: '+65', label: 'SG', country: 'Singapore' },
  { code: '+60', label: 'MY', country: 'Malaysia' },
];

const TOTAL_STEPS = 5;
const STEP_LABELS: Record<string, { step: number; label: string }> = {
  auth: { step: 1, label: 'Choose a method' },
  profile: { step: 2, label: 'Set up profile' },
  interests: { step: 3, label: 'Pick interests' },
  suggested: { step: 4, label: 'Follow creators' },
};

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ step?: string }>();
  const { signup, login } = useAuthStore();
  const { followCreator } = usePostStore();
  const [step, setStep] = useState<'welcome' | 'auth' | 'otp' | 'profile' | 'interests' | 'suggested' | 'login'>(
    params.step === 'login' ? 'login' : 'welcome'
  );
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [suggestedFollows, setSuggestedFollows] = useState<string[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step === 'suggested') {
      import('../../src/api/client').then(({ api }) =>
        api.users.suggested().then(setSuggestedUsers).catch(() => {})
      );
    }
  }, [step]);

  useEffect(() => {
    if (step === 'welcome') return;
    const onBackPress = () => {
      if (step === 'auth' || step === 'profile' || step === 'interests') {
        setError('');
        if (step === 'auth') setStep('welcome');
        else if (step === 'profile') setStep('auth');
        else if (step === 'interests') setStep('profile');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step]);

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    try {
      await login({ login: loginEmail, password: loginPassword });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    }
  };

  const handleSignupAuth = () => {
    if (authMethod === 'email' && !email) { setError('Email required'); return; }
    if (authMethod === 'email' && !password) { setError('Password required'); return; }
    if (authMethod === 'phone' && !phone) { setError('Phone number required'); return; }
    if (authMethod === 'phone' && !password) { setError('Password required'); return; }
    setError('');
    setStep('profile');
  };

  const handleProfileNext = (uname: string, dname: string) => {
    if (!uname || !dname) { setError('Fill all fields'); return; }
    setUsername(uname);
    setDisplayName(dname);
    setError('');
    setStep('interests');
  };

  const handleComplete = () => {
    if (selectedInterests.length < 2) { setError('Select at least 2 interests'); return; }
    setError('');
    setStep('suggested');
  };

  const handleFinishSignup = async () => {
    if (!username || !password) { setError('Username and password required'); return; }
    if (password.length < 12) { setError('Password must be at least 12 characters'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await signup({ username, password, displayName, email: email || undefined, phone: phone || undefined });
      for (const creatorId of suggestedFollows) {
        try { await followCreator(creatorId); } catch (e) { console.error(e); }
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = STEP_LABELS[step]?.step || 1;

  if (step === 'welcome') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <WelcomeHero
            onPhoneChosen={() => { setAuthMethod('phone'); setStep('auth'); }}
            onEmailChosen={() => { setAuthMethod('email'); setStep('auth'); }}
            onLogin={() => setStep('login')}
            onGuest={() => router.replace('/(tabs)')}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : 'padding'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#D85A30', '#D85A30', '#1a0e08', colors.bg]}
          locations={[0, 0.12, 0.35, 0.65]}
          style={styles.fullScreenGradient}
        >
          {/* Top bar */}
          <View style={[styles.fullTopBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => { setError(''); if (step === 'auth') setStep('welcome'); else if (step === 'profile') setStep('auth'); else if (step === 'interests') setStep('profile'); else if (step === 'suggested') setStep('interests'); }} style={styles.fullBackBtn}>
              <Text style={styles.fullBackText}>{'< Back'}</Text>
            </TouchableOpacity>
            <View style={styles.fullProgressRow}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.fullDot,
                    i + 1 === currentStep && styles.fullDotActive,
                    i + 1 < currentStep && styles.fullDotDone,
                  ]}
                />
              ))}
            </View>
            <View style={{ width: 40 }} />
          </View>

          {step === 'login' && <LoginStep onLogin={handleLogin} error={error} />}

          {step === 'auth' && (
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingBottom: 40 }}>
              <Text style={styles.authTitle}>{authMethod === 'phone' ? 'Your Phone Number' : 'Your Email'}</Text>
              <Text style={styles.authSub}>{authMethod === 'phone' ? "We'll send you a verification code" : 'Enter your email and choose a password'}</Text>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
                {authMethod === 'phone' ? (
                  <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="phone-pad" style={styles.authInput} />
                ) : (
                  <>
                    <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="email-address" autoCapitalize="none" style={styles.authInput} />
                    <TextInput value={password} onChangeText={setPassword} placeholder="Password (min 8 chars)" placeholderTextColor="rgba(255,255,255,0.3)" secureTextEntry style={styles.authInput} />
                  </>
                )}
              </View>
            </View>
          )}

          {step === 'profile' && <ProfileStep onNext={handleProfileNext} error={error} />}

          {step === 'interests' && (
            <InterestsStep
              selected={selectedInterests}
              onToggle={(id) => setSelectedInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])}
              onComplete={handleComplete}
              error={error}
            />
          )}

          {step === 'suggested' && (
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingBottom: 40 }}>
              <Text style={styles.authTitle}>Follow Some Creators</Text>
              <Text style={styles.authSub}>Your feed works best when you follow people you like.</Text>
              <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                {suggestedUsers.map((creator) => {
                  const isFollowed = suggestedFollows.includes(creator.id);
                  return (
                    <TouchableOpacity key={creator.id} onPress={() => setSuggestedFollows((prev) => prev.includes(creator.id) ? prev.filter((id) => id !== creator.id) : [...prev, creator.id])} style={[styles.suggestedRow, isFollowed && styles.suggestedRowActive]}>
                      <Avatar uri={creator.avatarUrl} size={40} isVerified={creator.isVerified} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestedName}>{creator.displayName}</Text>
                        <Text style={styles.suggestedUser}>@{creator.username}</Text>
                      </View>
                      <Text style={[styles.suggestedFollowBtn, isFollowed && styles.suggestedFollowBtnActive]}>{isFollowed ? 'Following' : 'Follow'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Bottom buttons */}
          <View style={styles.fullBottom}>
            {step === 'auth' && (
              <TouchableOpacity onPress={handleSignupAuth} style={styles.fullButton}>
                <Text style={styles.fullButtonText}>Continue</Text>
                <ArrowRight size={18} color={colors.white} />
              </TouchableOpacity>
            )}
            {step === 'suggested' && (
              <TouchableOpacity onPress={handleFinishSignup} disabled={isSubmitting} style={[styles.fullButton, isSubmitting && { opacity: 0.6 }]}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.fullButtonText}>Start watching</Text>
                    <ArrowRight size={18} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1 },
  fullScreenGradient: { flex: 1 },
  fullTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: spacing.sm },
  fullBackBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  fullBackText: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.sm, fontWeight: '600' },
  fullProgressRow: { flexDirection: 'row', gap: spacing.sm },
  fullDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  fullDotActive: { width: 20, backgroundColor: colors.accent, borderRadius: 3 },
  fullDotDone: { backgroundColor: 'rgba(216,90,48,0.5)' },
  fullBottom: { paddingHorizontal: spacing.xxl, paddingBottom: 40 },
  fullButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.accent, paddingVertical: 16, borderRadius: borderRadius.lg, width: '100%' },
  fullButtonText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
  authTitle: { color: colors.white, fontWeight: '700', fontSize: 26, marginBottom: spacing.sm },
  authSub: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.sm, lineHeight: 20 },
  errorText: { color: '#FF6B6B', fontSize: fontSize.sm, backgroundColor: 'rgba(255,107,107,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, marginTop: spacing.md },
  authInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.lg, padding: spacing.md + 2, color: colors.white, fontSize: fontSize.md },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: spacing.md, borderRadius: borderRadius.lg },
  suggestedRowActive: { borderColor: colors.accent, backgroundColor: 'rgba(216,90,48,0.1)' },
  suggestedName: { color: colors.white, fontWeight: '600', fontSize: fontSize.sm },
  suggestedUser: { color: 'rgba(255,255,255,0.4)', fontSize: fontSize.xs, marginTop: 1 },
  suggestedFollowBtn: { color: colors.accent, fontWeight: '700', fontSize: fontSize.sm },
  suggestedFollowBtnActive: { color: colors.success },
});
