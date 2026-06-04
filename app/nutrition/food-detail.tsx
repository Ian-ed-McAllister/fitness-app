import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles, cellStyles, extraStyles } from '../../src/styles/FoodDetail.styles';
import { getFoodById, addFoodLog, updateFoodLog } from '../../src/db/food';
import { DEFAULT_SLOT_LABELS } from '../../src/types/nutrition';
import type { FoodItem, MealSlot } from '../../src/types/nutrition';

type InputMode = 'servings' | 'weight';

export default function FoodDetailScreen() {
  const { foodId, mealSlot, date, logId, currentServings } = useLocalSearchParams<{
    foodId: string; mealSlot: string; date: string; logId?: string; currentServings?: string;
  }>();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(currentServings ? parseFloat(currentServings) : 1);
  const [servingText, setServingText] = useState(currentServings ?? '1');
  const [weightText, setWeightText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('servings');
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(mealSlot ?? 'snacks');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFoodById(foodId).then((f) => {
      setFood(f);
      if (f) {
        const init = currentServings ? parseFloat(currentServings) : 1;
        setWeightText(String(Math.round(init * f.servingSize)));
      }
    });
  }, [foodId]);

  function applyServings(val: number, f: FoodItem) {
    const v = Math.max(0.01, val);
    setServings(v);
    setServingText(Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));
    setWeightText(String(Math.round(v * f.servingSize)));
  }

  function onServingTextChange(text: string) {
    setServingText(text);
    const val = parseFloat(text);
    if (!isNaN(val) && val > 0 && food) {
      setServings(val);
      setWeightText(String(Math.round(val * food.servingSize)));
    }
  }

  function onWeightTextChange(text: string) {
    setWeightText(text);
    const grams = parseFloat(text);
    if (!isNaN(grams) && grams > 0 && food && food.servingSize > 0) {
      const computed = grams / food.servingSize;
      setServings(computed);
      setServingText(String(Math.round(computed * 100) / 100));
    }
  }

  function adjustServings(delta: number) {
    if (!food) return;
    applyServings(Math.max(0.25, Math.round((servings + delta) * 4) / 4), food);
  }

  function adjustWeight(deltaG: number) {
    if (!food) return;
    const nextG = Math.max(1, (parseFloat(weightText) || food.servingSize) + deltaG);
    setWeightText(String(nextG));
    const computed = nextG / food.servingSize;
    setServings(computed);
    setServingText(String(Math.round(computed * 100) / 100));
  }

  async function handleSave() {
    if (!food) return;
    setSaving(true);
    try {
      if (logId) {
        await updateFoodLog(logId, servings);
      } else {
        await addFoodLog({ foodId: food.id, date, mealSlot: selectedSlot, servings });
      }
      router.navigate('/(tabs)/');
    } catch {
      Alert.alert('Error', 'Could not save food log.');
    } finally {
      setSaving(false);
    }
  }

  if (!food) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color="#00D26A" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const m = (val: number) => Math.round(val * servings * 10) / 10;
  const totalCal = Math.round(food.calories * servings);
  const totalGrams = Math.round(servings * food.servingSize);
  const slotLabel = DEFAULT_SLOT_LABELS[selectedSlot] ?? selectedSlot;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{food.name}</Text>
          {food.brand && <Text style={styles.brand}>{food.brand}</Text>}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.calCard}>
          <Text style={styles.calNum}>{totalCal}</Text>
          <Text style={styles.calUnit}>kcal</Text>
          <Text style={styles.calSub}>{totalGrams}{food.servingUnit} · {Math.round(servings * 100) / 100} serving{servings !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.macroGrid}>
          <MacroCell label="Protein" value={m(food.protein)} color="#0A84FF" />
          <MacroCell label="Carbs" value={m(food.carbs)} color="#FF9F0A" />
          <MacroCell label="Fat" value={m(food.fat)} color="#FF453A" />
          {food.fiber != null && <MacroCell label="Fiber" value={m(food.fiber)} color="#30D158" />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity style={[styles.modeBtn, inputMode === 'servings' && styles.modeBtnActive]} onPress={() => setInputMode('servings')}>
              <Text style={[styles.modeBtnText, inputMode === 'servings' && styles.modeBtnTextActive]}>Servings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, inputMode === 'weight' && styles.modeBtnActive]} onPress={() => setInputMode('weight')}>
              <Text style={[styles.modeBtnText, inputMode === 'weight' && styles.modeBtnTextActive]}>Weight ({food.servingUnit})</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.servingBase}>1 serving = {food.servingSize}{food.servingUnit}</Text>
          {inputMode === 'servings' ? (
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustServings(-0.25)}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <TextInput style={styles.amountInput} value={servingText} onChangeText={onServingTextChange} keyboardType="decimal-pad" selectTextOnFocus />
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustServings(0.25)}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.inputUnit}>servings</Text>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWeight(-10)}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <TextInput style={styles.amountInput} value={weightText} onChangeText={onWeightTextChange} keyboardType="decimal-pad" selectTextOnFocus />
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWeight(10)}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.inputUnit}>{food.servingUnit}</Text>
            </View>
          )}
        </View>


        {(food.sugar != null || food.sodium != null || food.saturatedFat != null) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            <View style={styles.extraGrid}>
              {food.sugar != null && <ExtraRow label="Sugar" value={m(food.sugar)} />}
              {food.sodium != null && <ExtraRow label="Sodium" value={m(food.sodium)} unit="mg" />}
              {food.saturatedFat != null && <ExtraRow label="Saturated Fat" value={m(food.saturatedFat)} />}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>{logId ? 'Update Entry' : `Add to ${slotLabel}`}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MacroCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={cellStyles.cell}>
      <Text style={[cellStyles.val, { color }]}>{value}g</Text>
      <Text style={cellStyles.label}>{label}</Text>
    </View>
  );
}

function ExtraRow({ label, value, unit = 'g' }: { label: string; value: number; unit?: string }) {
  return (
    <View style={extraStyles.row}>
      <Text style={extraStyles.label}>{label}</Text>
      <Text style={extraStyles.val}>{value}{unit}</Text>
    </View>
  );
}
