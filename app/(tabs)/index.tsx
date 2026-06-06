import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, addDays, subDays, isToday } from 'date-fns';
import { Colors } from '../../src/constants/colors';
import { MacroRing, MealSection } from '../../src/components/nutrition';
import { ProgressBar } from '../../src/components/ui';
import { useNutritionStore, computeTotals } from '../../src/store/nutritionStore';
import { useProfileStore } from '../../src/store/profileStore';
import { DEFAULT_MEAL_SLOTS, DEFAULT_SLOT_LABELS } from '../../src/types/nutrition';
import { styles, macroBarStyles, waterStyles } from '../../src/styles/NutritionTab.styles';
import { sheetStyles } from '../../src/styles/Sheet.styles';
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

  const { waterGoalMl, todayWaterMl, addWater, loadTodayWater } = useProfileStore();
  const [customWaterVisible, setCustomWaterVisible] = useState(false);
  const [customWaterInput, setCustomWaterInput] = useState('');

  const [addMealVisible, setAddMealVisible] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [deleteMealSlot, setDeleteMealSlot] = useState<string | null>(null);
  const [slotPickerVisible, setSlotPickerVisible] = useState(false);

  useEffect(() => {
    loadGoals();
    loadCustomMealSlots();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDailyLog();
      loadTodayWater();
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
    setDeleteMealSlot(slot);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Nutrition</Text>
        <TouchableOpacity onPress={() => router.push('/nutrition/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
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

          {/* Water tracking */}
          <WaterCard
            current={todayWaterMl}
            goal={waterGoalMl}
            onAdd={(ml) => addWater(ml)}
            onCustom={() => { setCustomWaterInput(''); setCustomWaterVisible(true); }}
          />

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

      <TouchableOpacity style={styles.fab} onPress={() => setSlotPickerVisible(true)} activeOpacity={0.85}>
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

      {/* Slot picker sheet (FAB) */}
      <Modal visible={slotPickerVisible} transparent animationType="slide" onRequestClose={() => setSlotPickerVisible(false)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setSlotPickerVisible(false)}>
          <TouchableOpacity style={sheetStyles.sheet} activeOpacity={1}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.title}>Add Food To…</Text>
            {[...DEFAULT_MEAL_SLOTS, ...customMealSlots].map((slot, index, arr) => (
              <React.Fragment key={slot}>
                <TouchableOpacity
                  style={sheetStyles.action}
                  onPress={() => {
                    setSlotPickerVisible(false);
                    openAddFood(slot);
                  }}
                >
                  <View style={sheetStyles.actionIcon}>
                    <Ionicons name={slotIcon(slot)} size={20} color={Colors.primary} />
                  </View>
                  <Text style={sheetStyles.actionText}>
                    {DEFAULT_SLOT_LABELS[slot] ?? slot}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
                {index < arr.length - 1 && <View style={sheetStyles.divider} />}
              </React.Fragment>
            ))}
            <TouchableOpacity style={sheetStyles.cancel} onPress={() => setSlotPickerVisible(false)}>
              <Text style={sheetStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom water amount modal */}
      <Modal visible={customWaterVisible} transparent animationType="fade" onRequestClose={() => setCustomWaterVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCustomWaterVisible(false)}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text style={styles.modalTitle}>Add Water (ml)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 400"
              placeholderTextColor={Colors.textMuted}
              value={customWaterInput}
              onChangeText={setCustomWaterInput}
              keyboardType="number-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                const ml = parseInt(customWaterInput, 10);
                if (!isNaN(ml) && ml > 0) { addWater(ml); setCustomWaterVisible(false); }
              }}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setCustomWaterVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, !customWaterInput.trim() && styles.modalConfirmDisabled]}
                disabled={!customWaterInput.trim()}
                onPress={() => {
                  const ml = parseInt(customWaterInput, 10);
                  if (!isNaN(ml) && ml > 0) { addWater(ml); setCustomWaterVisible(false); }
                }}
              >
                <Text style={styles.modalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Remove custom meal slot sheet */}
      <Modal visible={!!deleteMealSlot} transparent animationType="slide" onRequestClose={() => setDeleteMealSlot(null)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setDeleteMealSlot(null)}>
          <TouchableOpacity style={sheetStyles.sheet} activeOpacity={1}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.title}>Remove Meal?</Text>
            <Text style={sheetStyles.subtitle}>"{deleteMealSlot}" and all food entries logged in it will be permanently deleted.</Text>
            <TouchableOpacity style={sheetStyles.dangerBtn} onPress={() => { if (deleteMealSlot) { removeCustomMealSlot(deleteMealSlot); setDeleteMealSlot(null); } }}>
              <Ionicons name="remove-circle-outline" size={18} color={Colors.textInverse} />
              <Text style={sheetStyles.dangerBtnText}>Remove Meal Slot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sheetStyles.cancel} onPress={() => setDeleteMealSlot(null)}>
              <Text style={sheetStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
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

function WaterCard({ current, goal, onAdd, onCustom }: {
  current: number; goal: number;
  onAdd: (ml: number) => void; onCustom: () => void;
}) {
  const pct = Math.min(1, current / Math.max(goal, 1));
  const remaining = Math.max(0, goal - current);
  return (
    <View style={waterStyles.card}>
      <View style={waterStyles.header}>
        <View style={waterStyles.titleRow}>
          <Ionicons name="water" size={16} color="#4FC3F7" />
          <Text style={waterStyles.title}>Water</Text>
        </View>
        <Text style={waterStyles.amount}>
          <Text style={waterStyles.current}>{Math.round(current)}</Text>
          <Text style={waterStyles.goal}> / {goal} ml</Text>
        </Text>
      </View>
      <View style={waterStyles.bar}>
        <View style={[waterStyles.fill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      {remaining > 0 && (
        <Text style={waterStyles.remaining}>{remaining} ml to go</Text>
      )}
      <View style={waterStyles.quickAdd}>
        {[200, 350, 500, 750].map((ml) => (
          <TouchableOpacity key={ml} style={waterStyles.pill} onPress={() => onAdd(ml)}>
            <Text style={waterStyles.pillText}>+{ml}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[waterStyles.pill, waterStyles.pillCustom]} onPress={onCustom}>
          <Ionicons name="add" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function slotIcon(slot: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (slot) {
    case 'breakfast': return 'sunny-outline';
    case 'lunch':     return 'partly-sunny-outline';
    case 'dinner':    return 'moon-outline';
    case 'snacks':    return 'cafe-outline';
    default:          return 'restaurant-outline';
  }
}
