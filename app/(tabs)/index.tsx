import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, addDays, subDays, isToday } from 'date-fns';
import { Colors } from '../../src/constants/colors';
import { MacroRing, MealSection } from '../../src/components/nutrition';
import { ProgressBar } from '../../src/components/ui';
import { useNutritionStore, computeTotals } from '../../src/store/nutritionStore';
import { DEFAULT_MEAL_SLOTS } from '../../src/types/nutrition';
import { styles, macroBarStyles } from '../../src/styles/NutritionTab.styles';
import type { FoodLogEntry, MealSlot } from '../../src/types/nutrition';

export default function NutritionTab() {
  const {
    selectedDate,
    dailyLog,
    goals,
    isLoading,
    customMealSlots,
    setSelectedDate,
    loadDailyLog,
    loadGoals,
    loadCustomMealSlots,
    removeLogEntry,
    addCustomMealSlot,
    removeCustomMealSlot,
  } = useNutritionStore();

  const [addMealVisible, setAddMealVisible] = useState(false);
  const [newMealName, setNewMealName] = useState('');

  useEffect(() => {
    loadGoals();
    loadCustomMealSlots();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDailyLog();
    }, [selectedDate])
  );

  const totals = computeTotals(dailyLog);
  const allSlots: MealSlot[] = [...DEFAULT_MEAL_SLOTS, ...customMealSlots];
  const dateLabel = isToday(parseISO(selectedDate)) ? 'Today' : format(parseISO(selectedDate), 'MMM d');
  const canGoForward = !isToday(parseISO(selectedDate));

  function goBack() {
    setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
  }

  function goForward() {
    if (!canGoForward) return;
    setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
  }

  function openAddFood(slot: MealSlot) {
    router.push({ pathname: '/nutrition/add-food', params: { mealSlot: slot, date: selectedDate } });
  }

  function openFoodDetail(entry: FoodLogEntry) {
    router.push({
      pathname: '/nutrition/food-detail',
      params: {
        foodId: entry.foodId,
        mealSlot: entry.mealSlot,
        date: entry.date,
        logId: entry.id,
        currentServings: String(entry.servings),
      },
    });
  }

  async function handleAddMeal() {
    const name = newMealName.trim();
    if (!name) return;
    await addCustomMealSlot(name);
    setNewMealName('');
    setAddMealVisible(false);
  }

  function handleDeleteMeal(slot: string) {
    Alert.alert('Remove Meal', `Remove "${slot}" from today's view?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCustomMealSlot(slot) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={goBack} style={styles.arrow} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <TouchableOpacity onPress={goForward} style={styles.arrow} hitSlop={12} disabled={!canGoForward}>
          <Ionicons name="chevron-forward" size={22} color={canGoForward ? Colors.textSecondary : Colors.surface2} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View style={styles.ringRow}>
              <MacroRing calories={totals.calories} goalCalories={goals.calories} />
              <View style={styles.goalStack}>
                <Text style={styles.goalTitle}>Daily Goal</Text>
                <Text style={styles.goalVal}>{goals.calories} kcal</Text>
                <View style={styles.goalStat}>
                  <Text style={styles.statLabel}>Eaten</Text>
                  <Text style={styles.statVal}>{Math.round(totals.calories)}</Text>
                </View>
                <View style={styles.goalStat}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={[styles.statVal, totals.calories > goals.calories && { color: Colors.danger }]}>
                    {Math.max(0, Math.round(goals.calories - totals.calories))}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.macroSection}>
              <MacroBar label="Protein" current={totals.protein} goal={goals.protein} color={Colors.protein} />
              <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} color={Colors.carbs} />
              <MacroBar label="Fat" current={totals.fat} goal={goals.fat} color={Colors.fat} />
            </View>
          </View>

          {allSlots.map((slot) => (
            <MealSection
              key={slot}
              slot={slot}
              entries={dailyLog.filter((e) => e.mealSlot === slot)}
              onAdd={() => openAddFood(slot)}
              onDelete={() => handleDeleteMeal(slot)}
              onEntryPress={openFoodDetail}
              onEntryDelete={(e) => removeLogEntry(e.id)}
            />
          ))}

          <TouchableOpacity style={styles.addMealBtn} onPress={() => setAddMealVisible(true)} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.addMealText}>Add Meal</Text>
          </TouchableOpacity>

          <View style={styles.bottomPad} />
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => openAddFood('snacks')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </TouchableOpacity>

      <Modal visible={addMealVisible} transparent animationType="fade" onRequestClose={() => setAddMealVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAddMealVisible(false)}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text style={styles.modalTitle}>Add Meal</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Pre-Workout, Lunch 2..."
              placeholderTextColor={Colors.textMuted}
              value={newMealName}
              onChangeText={setNewMealName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddMeal}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setAddMealVisible(false); setNewMealName(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, !newMealName.trim() && styles.modalConfirmDisabled]} onPress={handleAddMeal} disabled={!newMealName.trim()}>
                <Text style={styles.modalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  return (
    <View style={macroBarStyles.wrap}>
      <View style={macroBarStyles.labels}>
        <Text style={macroBarStyles.label}>{label}</Text>
        <Text style={macroBarStyles.val}>
          {Math.round(current)}
          <Text style={macroBarStyles.goal}>/{goal}g</Text>
        </Text>
      </View>
      <ProgressBar current={current} goal={goal} color={color} height={5} />
    </View>
  );
}
