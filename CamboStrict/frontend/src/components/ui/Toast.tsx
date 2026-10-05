import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

interface ToastProps {
  message: string | null;
  type?: 'info' | 'success' | 'error';
}

const toastColors = {
  info: { bg: 'rgba(216,90,48,0.15)', border: 'rgba(216,90,48,0.3)', text: colors.accent },
  success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#22C55E' },
  error: { bg: 'rgba(226,75,74,0.15)', border: 'rgba(226,75,74,0.3)', text: '#E24B4A' },
};

export function Toast({ message, type = 'info' }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const tc = toastColors[type];

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }], backgroundColor: tc.bg, borderColor: tc.border }]}>
      <Text style={[styles.text, { color: tc.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.xl,
    right: spacing.xl,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    zIndex: 1000,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
});
