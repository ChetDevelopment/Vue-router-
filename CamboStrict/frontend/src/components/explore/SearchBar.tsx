import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { noOutline } from '../../stores/shared/constants';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search creators, hashtags...' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}><Search size={14} color={colors.textMuted} /></View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, noOutline]}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
          <X size={14} color={colors.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  icon: { marginRight: spacing.sm, justifyContent: 'center' },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    height: '100%',
  },
  clearBtn: {
    backgroundColor: 'rgba(216,90,48,0.1)',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
});
