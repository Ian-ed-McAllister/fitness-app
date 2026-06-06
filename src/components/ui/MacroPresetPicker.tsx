import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Preset {
  label: string;
  sub: string;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

const PRESETS: Preset[] = [
  { label: 'Balanced',     sub: '30P · 40C · 30F',  proteinPct: 30, carbsPct: 40, fatPct: 30 },
  { label: 'High Protein', sub: '40P · 35C · 25F',  proteinPct: 40, carbsPct: 35, fatPct: 25 },
  { label: 'High Carb',    sub: '20P · 55C · 25F',  proteinPct: 20, carbsPct: 55, fatPct: 25 },
  { label: 'Low Carb',     sub: '35P · 20C · 45F',  proteinPct: 35, carbsPct: 20, fatPct: 45 },
  { label: 'Keto',         sub: '20P · 5C · 75F',   proteinPct: 20, carbsPct: 5,  fatPct: 75 },
  { label: 'High Fat',     sub: '25P · 30C · 45F',  proteinPct: 25, carbsPct: 30, fatPct: 45 },
];

interface Props {
  calories: number;
  onApply: (protein: number, carbs: number, fat: number) => void;
}

export function MacroPresetPicker({ calories, onApply }: Props) {
  if (!calories || calories <= 0) return null;

  function apply(preset: Preset) {
    const protein = Math.round((calories * preset.proteinPct) / 100 / 4);
    const carbs   = Math.round((calories * preset.carbsPct)   / 100 / 4);
    const fat     = Math.round((calories * preset.fatPct)     / 100 / 9);
    onApply(protein, carbs, fat);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Macro Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PRESETS.map((p) => (
          <TouchableOpacity key={p.label} style={styles.chip} onPress={() => apply(p)} activeOpacity={0.7}>
            <Text style={styles.chipLabel}>{p.label}</Text>
            <Text style={styles.chipSub}>{p.sub}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: {
    fontSize: 12, fontWeight: '600', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row: { gap: 8, paddingBottom: 2 },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 3,
  },
  chipLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  chipSub: { fontSize: 11, color: Colors.textMuted },
});
