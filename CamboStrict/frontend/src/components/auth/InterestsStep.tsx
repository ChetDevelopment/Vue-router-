import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { INTEREST_CATEGORIES } from '../../constants/data';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

interface InterestsStepProps {
  selected: string[];
  onToggle: (id: string) => void;
  onComplete: () => void;
  error: string;
}

export function InterestsStep({ selected, onToggle, onComplete, error }: InterestsStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick Your Interests</Text>
      <Text style={styles.sub}>Select at least 2 to personalize your feed.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.grid}>
        {INTEREST_CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.id);
          return (
            <TouchableOpacity key={cat.id} onPress={() => onToggle(cat.id)} style={[styles.card, isSelected && styles.cardActive]}>
              <Text style={[styles.cardText, isSelected && styles.cardTextActive]}>{cat.label}</Text>
              {isSelected && <CheckCircle2 size={14} color={colors.accent} />}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.count}>{selected.length} selected</Text>
      <TouchableOpacity onPress={onComplete} style={styles.button}>
        <Text style={styles.buttonText}>Let's Start!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingBottom: 40 },
  title: { color: colors.white, fontWeight: '700', fontSize: 26, marginBottom: spacing.sm },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.sm, lineHeight: 20 },
  error: { color: '#FF6B6B', fontSize: fontSize.sm, backgroundColor: 'rgba(255,107,107,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, marginTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  card: { width: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: spacing.md, borderRadius: borderRadius.lg },
  cardActive: { borderColor: colors.accent, backgroundColor: 'rgba(216,90,48,0.15)' },
  cardText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: fontSize.sm },
  cardTextActive: { color: colors.white },
  count: { color: 'rgba(255,255,255,0.4)', fontSize: fontSize.sm, textAlign: 'center', marginVertical: spacing.md },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.accent, paddingVertical: 16, borderRadius: borderRadius.lg, width: '100%' },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
});
