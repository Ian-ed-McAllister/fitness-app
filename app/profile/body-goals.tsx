import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useProfileStore } from '../../src/store/profileStore';
import { useWeightStore } from '../../src/store/weightStore';
import {
  BODY_GOAL_LABELS, ACTIVITY_LABELS, ACTIVITY_DESCRIPTIONS,
  calculateTDEE, suggestedCalories, suggestedMacros, ageFromDOB,
  type BodyGoal, type ActivityLevel,
} from '../../src/utils/tdee';
import { useNutritionStore } from '../../src/store/nutritionStore';

const BODY_GOALS: BodyGoal[] = ['lose_fat', 'maintain', 'gain_muscle', 'bulk', 'recomp'];
const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very_active', 'athlete'];

const GOAL_ICONS: Record<BodyGoal, string> = {
  lose_fat: '↓',
  maintain: '→',
  gain_muscle: '↑',
  bulk: '⬆',
  recomp: '⇄',
};

export default function BodyGoalsScreen() {
  const {
    bodyGoal: storeGoal,
    activityLevel: storeActivity,
    goalWeight: storeGoalWeight,
    weeklyWorkoutTarget: storeTarget,
    waterGoalMl: storeWater,
    dateOfBirth, biologicalSex, heightCm,
    updateProfile, loadProfile,
  } = useProfileStore();

  const { entries: weightEntries } = useWeightStore();
  const { goals: nutritionGoals, updateGoals } = useNutritionStore();
  const currentWeight = weightEntries[0]?.weight ?? null;
  const weightUnit = weightEntries[0]?.unit ?? 'kg';

  const [bodyGoal, setBodyGoal] = useState<BodyGoal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goalWeightStr, setGoalWeightStr] = useState('');
  const [goalWeightUnit, setGoalWeightUnit] = useState<'kg' | 'lb'>(weightUnit as 'kg' | 'lb');
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [waterGoalStr, setWaterGoalStr] = useState('2500');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile().then(() => {
      const s = useProfileStore.getState();
      setBodyGoal(s.bodyGoal);
      setActivityLevel(s.activityLevel);
      setGoalWeightStr(s.goalWeight ? String(s.goalWeight) : '');
      setWeeklyTarget(s.weeklyWorkoutTarget);
      setWaterGoalStr(String(s.waterGoalMl));
    });
  }, []);

  useEffect(() => {
    setBodyGoal(storeGoal);
    setActivityLevel(storeActivity);
    setWeeklyTarget(storeTarget);
    setWaterGoalStr(String(storeWater));
    // Load goal weight and display in the user's current weight unit
    if (storeGoalWeight) {
      const displayVal = weightUnit === 'lb'
        ? Math.round(storeGoalWeight * 2.20462 * 10) / 10
        : storeGoalWeight;
      setGoalWeightStr(String(displayVal));
      setGoalWeightUnit(weightUnit as 'kg' | 'lb');
    }
  }, [storeGoal, storeActivity, storeGoalWeight, storeTarget, storeWater, weightUnit]);

  function handleUnitToggle(newUnit: 'kg' | 'lb') {
    if (newUnit === goalWeightUnit) return;
    const val = parseFloat(goalWeightStr);
    if (!isNaN(val)) {
      const converted = newUnit === 'lb'
        ? Math.round(val * 2.20462 * 10) / 10
        : Math.round((val / 2.20462) * 10) / 10;
      setGoalWeightStr(String(converted));
    }
    setGoalWeightUnit(newUnit);
  }

  // Live TDEE suggestion
  const tdee =
    currentWeight && heightCm && dateOfBirth && biologicalSex
      ? calculateTDEE({
          weightKg: currentWeight,
          heightCm,
          ageYears: ageFromDOB(dateOfBirth),
          sex: biologicalSex,
          activityLevel,
        })
      : null;
  const suggested = tdee ? suggestedCalories(tdee, bodyGoal) : null;
  const macros = suggested ? suggestedMacros(suggested, currentWeight ?? 70) : null;

  async function handleSave() {
    setSaving(true);
    try {
      // Always store goal weight in the user's current weight unit
      let goalWeightToSave: number | null = null;
      if (goalWeightStr) {
        const val = parseFloat(goalWeightStr);
        if (!isNaN(val)) {
          goalWeightToSave = goalWeightUnit === 'lb' && weightUnit === 'kg'
            ? Math.round((val / 2.20462) * 10) / 10
            : goalWeightUnit === 'kg' && weightUnit === 'lb'
            ? Math.round(val * 2.20462 * 10) / 10
            : val;
        }
      }
      await updateProfile({
        bodyGoal,
        activityLevel,
        goalWeight: goalWeightToSave,
        weeklyWorkoutTarget: weeklyTarget,
        waterGoalMl: parseInt(waterGoalStr, 10) || 2500,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); router.back(); }, 800);
    } finally {
      setSaving(false);
    }
  }

  async function applysuggested() {
    if (!suggested || !macros) return;
    await updateGoals({ calories: suggested, protein: macros.protein, carbs: macros.carbs, fat: macros.fat });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Body Goals</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Body Goal */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Goal</Text>
            {BODY_GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.optionRow, bodyGoal === g && styles.optionRowActive]}
                onPress={() => setBodyGoal(g)}
              >
                <View style={[styles.optionIcon, bodyGoal === g && styles.optionIconActive]}>
                  <Text style={[styles.optionEmoji, bodyGoal === g && { color: Colors.primary }]}>
                    {GOAL_ICONS[g]}
                  </Text>
                </View>
                <Text style={[styles.optionLabel, bodyGoal === g && styles.optionLabelActive]}>
                  {BODY_GOAL_LABELS[g]}
                </Text>
                {bodyGoal === g && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Activity level */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Activity Level</Text>
            {ACTIVITY_LEVELS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.optionRow, activityLevel === a && styles.optionRowActive]}
                onPress={() => setActivityLevel(a)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, activityLevel === a && styles.optionLabelActive]}>
                    {ACTIVITY_LABELS[a]}
                  </Text>
                  <Text style={styles.optionSub}>{ACTIVITY_DESCRIPTIONS[a]}</Text>
                </View>
                {activityLevel === a && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Goal weight */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Goal Weight</Text>
            <View style={styles.goalWeightRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={goalWeightStr}
                onChangeText={setGoalWeightStr}
                keyboardType="decimal-pad"
                placeholder={currentWeight
                  ? `Current: ${goalWeightUnit === 'lb' ? Math.round(currentWeight * 2.20462 * 10) / 10 : currentWeight} ${goalWeightUnit}`
                  : 'e.g. 75'}
                placeholderTextColor={Colors.textMuted}
                selectTextOnFocus
              />
              <View style={styles.unitToggle}>
                {(['kg', 'lb'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitBtn, goalWeightUnit === u && styles.unitBtnActive]}
                    onPress={() => handleUnitToggle(u)}
                  >
                    <Text style={[styles.unitBtnText, goalWeightUnit === u && styles.unitBtnTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Weekly workout target */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Weekly Workout Target</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setWeeklyTarget((v) => Math.max(1, v - 1))}
              >
                <Ionicons name="remove" size={20} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{weeklyTarget} <Text style={styles.stepUnit}>days / week</Text></Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setWeeklyTarget((v) => Math.min(7, v + 1))}
              >
                <Ionicons name="add" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Water goal */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Daily Water Goal (ml)</Text>
            <TextInput
              style={styles.input}
              value={waterGoalStr}
              onChangeText={setWaterGoalStr}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          </View>

          {/* TDEE suggestion card */}
          {suggested && macros && (
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Ionicons name="flash" size={18} color={Colors.warning} />
                <Text style={styles.suggestionTitle}>Suggested for your goal</Text>
              </View>
              <Text style={styles.suggestionCal}>{suggested.toLocaleString()} <Text style={styles.suggestionUnit}>kcal/day</Text></Text>
              <Text style={styles.suggestionMacros}>
                {macros.protein}g protein · {macros.carbs}g carbs · {macros.fat}g fat
              </Text>
              <TouchableOpacity style={styles.applyBtn} onPress={applysuggested}>
                <Text style={styles.applyBtnText}>Apply to Nutrition Goals</Text>
              </TouchableOpacity>
            </View>
          )}

          {!tdee && (
            <View style={styles.tdeeMissing}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.tdeeMissingText}>Add height, date of birth & sex in Edit Profile to see calorie suggestions.</Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={Colors.textInverse} /> :
           saved ? (
             <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
               <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} />
               <Text style={styles.saveBtnText}>Saved!</Text>
             </View>
           ) : <Text style={styles.saveBtnText}>Save Goals</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.text },
  content: { padding: 16, gap: 20 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'transparent',
  },
  optionRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  optionIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  optionIconActive: { backgroundColor: Colors.primaryMuted },
  optionEmoji: { fontSize: 16, color: Colors.textMuted, fontWeight: '700' },
  optionLabel: { fontSize: 15, fontWeight: '500', color: Colors.textSecondary, flex: 1 },
  optionLabelActive: { color: Colors.text, fontWeight: '600' },
  optionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 17, color: Colors.text,
  },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 4,
  },
  stepBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  stepValue: {
    flex: 1, textAlign: 'center',
    fontSize: 20, fontWeight: '700', color: Colors.text,
  },
  stepUnit: { fontSize: 13, fontWeight: '400', color: Colors.textMuted },
  suggestionCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  suggestionTitle: { fontSize: 13, fontWeight: '600', color: Colors.warning },
  suggestionCal: { fontSize: 28, fontWeight: '800', color: Colors.text },
  suggestionUnit: { fontSize: 14, fontWeight: '400', color: Colors.textMuted },
  suggestionMacros: { fontSize: 13, color: Colors.textMuted },
  applyBtn: {
    backgroundColor: Colors.surface2, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', marginTop: 4,
  },
  applyBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  goalWeightRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10, padding: 3, gap: 2,
  },
  unitBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center' },
  unitBtnActive: { backgroundColor: Colors.primary },
  unitBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  unitBtnTextActive: { color: Colors.textInverse },
  tdeeMissing: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 12,
  },
  tdeeMissingText: { flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  footer: { padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: Colors.border },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },
});
