import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../../constants/theme';

interface ActionButtonProps {
  icon: React.ComponentType<{ size?: number; color?: string; fill?: string; strokeWidth?: number }>;
  count?: string;
  active?: boolean;
  onPress: () => void;
  activeColor?: string;
  label?: string;
  size?: number;
  iconSize?: number;
}

export function ActionButton({
  icon: Icon, count, active, onPress, activeColor = colors.accent, label, size, iconSize = 22,
}: ActionButtonProps) {
  return (
    <TouchableOpacity accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.actionBtn}>
      <View style={[styles.actionIcon, active && { backgroundColor: `${activeColor}26` }]}>
        <Icon size={iconSize} color={active ? activeColor : colors.text} fill={active ? activeColor : 'none'} strokeWidth={1.8} />
      </View>
      {count != null && <Text style={styles.actionCount}>{count}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionBtn: { alignItems: 'center', gap: 3 },
  actionIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  actionCount: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },
});
