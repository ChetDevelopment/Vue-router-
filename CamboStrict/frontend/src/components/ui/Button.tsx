import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [styles.base];
  if (variant === 'primary') containerStyle.push(styles.primary);
  if (variant === 'secondary') containerStyle.push(styles.secondary);
  if (variant === 'ghost') containerStyle.push(styles.ghost);
  if (variant === 'danger') containerStyle.push(styles.danger);
  if (size === 'sm') containerStyle.push(styles.sm);
  if (size === 'lg') containerStyle.push(styles.lg);
  if (isDisabled) containerStyle.push(styles.disabled);
  if (style) containerStyle.push(style);

  const textStyles: TextStyle[] = [styles.text];
  if (variant === 'ghost') textStyles.push(styles.textGhost);
  if (size === 'sm') textStyles.push(styles.textSm);
  if (size === 'lg') textStyles.push(styles.textLg);
  if (textStyle) textStyles.push(textStyle);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.accent : colors.white} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: colors.transparent },
  danger: { backgroundColor: colors.danger },
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: 14, paddingHorizontal: spacing.xl },
  disabled: { opacity: 0.5 },
  text: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  textGhost: { color: colors.accent },
  textSm: { fontSize: fontSize.xs },
  textLg: { fontSize: fontSize.md },
});
