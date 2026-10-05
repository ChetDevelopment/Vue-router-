import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Smartphone, Mail, X } from 'lucide-react-native';
import { GoogleIcon, FacebookIcon, AppleIcon } from '../ui/BrandIcons';
import { AppLogoMark } from '../ui/AppLogo';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { loginWithGoogle, loginWithFacebook, loginWithApple } from '../../utils/socialAuth';

interface WelcomeHeroProps {
  onPhoneChosen: () => void;
  onEmailChosen: () => void;
  onLogin: () => void;
  onGuest: () => void;
}

export function WelcomeHero({ onPhoneChosen, onEmailChosen, onLogin, onGuest }: WelcomeHeroProps) {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 100 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [logoScale, logoOpacity]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#D85A30', '#D85A30', '#1a0e08', colors.bg]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.heroGradient}
      >
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.heroClose}>
          <X size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <AppLogoMark size={88} />
        </Animated.View>
        <Text style={styles.heroTitle}>River</Text>
        <Text style={styles.heroTagline}>Cambodia's Short-Video{'\n'}Platform</Text>
      </LinearGradient>

      <View style={styles.actionArea}>
        <TouchableOpacity onPress={onPhoneChosen} style={styles.phoneBtn}>
          <Smartphone size={18} color={colors.white} />
          <Text style={styles.phoneBtnText}>Continue with Phone</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onEmailChosen} style={styles.emailBtn}>
          <Mail size={18} color={colors.textMuted} />
          <Text style={styles.emailBtnText}>Continue with Email</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity onPress={async () => {
            try {
              const res = await loginWithGoogle();
              useAuthStore.getState().setCurrentUser(res.user);
              router.replace('/(tabs)');
            } catch (e: any) {
              if (e.message !== 'Google login was cancelled') {
                Alert.alert('Google Login', e.message || 'Failed to sign in with Google.');
              }
            }
          }} style={styles.socialBtn}>
            <GoogleIcon size={16} />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            try {
              const res = await loginWithFacebook();
              useAuthStore.getState().setCurrentUser(res.user);
              router.replace('/(tabs)');
            } catch (e: any) {
              if (e.message !== 'Facebook login was cancelled') {
                Alert.alert('Facebook Login', e.message || 'Failed to sign in with Facebook.');
              }
            }
          }} style={styles.socialBtn}>
            <FacebookIcon size={16} />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            try {
              const res = await loginWithApple();
              useAuthStore.getState().setCurrentUser(res.user);
              router.replace('/(tabs)');
            } catch (e: any) {
              if (e.message !== 'Apple login was cancelled') {
                Alert.alert('Apple Login', e.message || 'Failed to sign in with Apple.');
              }
            }
          }} style={styles.socialBtn}>
            <AppleIcon size={16} />
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', paddingTop: spacing.xl }}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
            Already have an account?{' '}
            <Text onPress={onLogin} style={{ color: colors.accent, fontWeight: '700' }}>
              Log in
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroGradient: { paddingTop: 80, paddingBottom: 60, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'flex-end', minHeight: '55%' },
  logoWrap: { marginBottom: spacing.lg, shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
  heroTitle: { color: colors.white, fontWeight: '800', fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  heroTagline: { color: 'rgba(255,255,255,0.6)', fontSize: fontSize.md, textAlign: 'center', lineHeight: 22, letterSpacing: 0.3 },
  heroClose: { position: 'absolute', right: spacing.lg, top: 50, zIndex: 10, padding: spacing.md },
  actionArea: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, gap: spacing.md, justifyContent: 'flex-start' },
  phoneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.accent, paddingVertical: 14, borderRadius: borderRadius.lg, shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
  phoneBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
  emailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 14, borderRadius: borderRadius.lg },
  emailBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: fontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  socialRow: { flexDirection: 'row', gap: spacing.sm },
  socialBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  socialText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: fontSize.sm },
});
