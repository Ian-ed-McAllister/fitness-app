import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useNutritionStore } from '../../src/store/nutritionStore';
import { useWeightStore } from '../../src/store/weightStore';
import { useProfileStore } from '../../src/store/profileStore';
import { MacroPresetPicker } from '../../src/components/ui/MacroPresetPicker';

export default function NutritionSettingsScreen() {
  const { goals, loadGoals, updateGoals } = useNutritionStore();
  const { unit: weightUnit, setUnit } = useWeightStore();
  const { waterGoalMl, updateProfile, loadProfile } = useProfileStore();

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [waterGoal, setWaterGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadGoals();
    loadProfile();
  }, []);

  // Sync once goals load from DB
  useEffect(() => {
    setCalories(String(goals.calories));
    setProtein(String(goals.protein));
    setCarbs(String(goals.carbs));
    setFat(String(goals.fat));
  }, [goals.calories, goals.protein, goals.carbs, goals.fat]);

  useEffect(() => {
    setWaterGoal(String(waterGoalMl));
  }, [waterGoalMl]);

  function validate() {
    const errs: Record<string, string> = {};
    const fields = { calories, protein, carbs, fat };
    for (const [key, val] of Object.entries(fields)) {
      const n = parseInt(val, 10);
      if (!val.trim() || isNaN(n) || n <= 0) {
        errs[key] = 'Must be a positive number';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await Promise.all([
        updateGoals({
          calories: parseInt(calories, 10),
          protein: parseInt(protein, 10),
          carbs: parseInt(carbs, 10),
          fat: parseInt(fat, 10),
        }),
        updateProfile({
          waterGoalMl: parseInt(waterGoal, 10) || 2500,
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Goals & Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Daily Calorie & Macro Goals ─────────────────────────── */}
          <Text style={styles.sectionLabel}>Daily Goals</Text>

          <GoalField
            label="Calories"
            unit="kcal"
            value={calories}
            onChange={setCalories}
            error={errors.calories}
          />

          <MacroPresetPicker
            calories={parseInt(calories, 10) || 0}
            onApply={(p, c, f) => { setProtein(String(p)); setCarbs(String(c)); setFat(String(f)); }}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <GoalField
                label="Protein"
                unit="g"
                value={protein}
                onChange={setProtein}
                error={errors.protein}
              />
            </View>
            <View style={{ flex: 1 }}>
              <GoalField
                label="Carbs"
                unit="g"
                value={carbs}
                onChange={setCarbs}
                error={errors.carbs}
              />
            </View>
          </View>
          <View style={styles.row2Half}>
            <View style={{ flex: 1 }}>
              <GoalField
                label="Fat"
                unit="g"
                value={fat}
                onChange={setFat}
                error={errors.fat}
              />
            </View>
            <View style={{ flex: 1 }} />
          </View>

          {/* ── Macro calorie breakdown hint ─────────────────────────── */}
          {calories && protein && carbs && fat && (
            <MacroCalHint
              calorieGoal={parseInt(calories, 10) || 0}
              protein={parseInt(protein, 10) || 0}
              carbs={parseInt(carbs, 10) || 0}
              fat={parseInt(fat, 10) || 0}
            />
          )}

          <View style={styles.divider} />

          {/* ── Water Goal ───────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Daily Water Goal (ml)</Text>
          <GoalField
            label="Water"
            unit="ml"
            value={waterGoal}
            onChange={setWaterGoal}
          />

          <View style={styles.divider} />

          {/* ── Weight Unit ──────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Weight Unit</Text>
          <View style={styles.unitToggle}>
            {(['kg', 'lb'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, weightUnit === u && styles.unitBtnActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitBtnText, weightUnit === u && styles.unitBtnTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : saved ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} />
              <Text style={styles.saveBtnText}>Saved!</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>Save Goals</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function GoalField({
  label,
  unit,
  value,
  onChange,
  error,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label} <Text style={fieldStyles.unit}>({unit})</Text>
      </Text>
      <TextInput
        style={[fieldStyles.input, !!error && fieldStyles.inputError]}
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        selectTextOnFocus
        placeholderTextColor={Colors.textMuted}
      />
      {!!error && <Text style={fieldStyles.errorText}>{error}</Text>}
    </View>
  );
}

function MacroCalHint({
  calorieGoal,
  protein,
  carbs,
  fat,
}: {
  calorieGoal: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const fromMacros = protein * 4 + carbs * 4 + fat * 9;
  const diff = Math.abs(fromMacros - calorieGoal);
  if (diff < 20) return null;
  return (
    <View style={styles.hintBox}>
      <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
      <Text style={styles.hintText}>
        Macro calories add up to {fromMacros} kcal — {diff > 0 ? (fromMacros > calorieGoal ? 'above' : 'below') : ''} your calorie goal by {diff} kcal.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.text },
  content: { padding: 16, gap: 14 },
  row2: { flexDirection: 'row', gap: 12 },
  row2Half: { flexDirection: 'row', gap: 12 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
    gap: 2,
    alignSelf: 'flex-start',
  },
  unitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
  },
  unitBtnActive: { backgroundColor: Colors.primary },
  unitBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  unitBtnTextActive: { color: Colors.textInverse },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 10,
    padding: 12,
  },
  hintText: { flex: 1, fontSize: 13, color: Colors.warning, lineHeight: 18 },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },
});

const fieldStyles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  unit: { textTransform: 'none' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: { borderColor: Colors.danger },
  errorText: { fontSize: 11, color: Colors.danger },
});
