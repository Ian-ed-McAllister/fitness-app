import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles, fieldStyles } from '../../src/styles/ManualEntry.styles';
import { saveFood } from '../../src/db/food';

export default function ManualEntryScreen() {
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot: string; date: string }>();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [saving, setSaving] = useState(false);

  function num(val: string) {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a food name.'); return; }
    if (!calories.trim()) { Alert.alert('Required', 'Please enter calories.'); return; }
    setSaving(true);
    try {
      const food = await saveFood({
        name: name.trim(),
        brand: brand.trim() || undefined,
        source: 'custom',
        servingSize: num(servingSize) || 100,
        servingUnit: servingUnit.trim() || 'g',
        calories: num(calories),
        protein: num(protein),
        carbs: num(carbs),
        fat: num(fat),
        fiber: fiber ? num(fiber) : undefined,
        sugar: sugar ? num(sugar) : undefined,
        sodium: sodium ? num(sodium) : undefined,
      });
      router.replace({ pathname: '/nutrition/food-detail', params: { foodId: food.id, mealSlot, date } });
    } catch {
      Alert.alert('Error', 'Could not save food.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Custom Food</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field label="Food Name *" value={name} onChange={setName} placeholder="e.g. Grilled Chicken" />
          <Field label="Brand" value={brand} onChange={setBrand} placeholder="Optional" />
          <View style={styles.row2}>
            <View style={{ flex: 2 }}><Field label="Serving Size *" value={servingSize} onChange={setServingSize} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Unit" value={servingUnit} onChange={setServingUnit} placeholder="g" /></View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Nutrition per serving</Text>
          <Field label="Calories (kcal) *" value={calories} onChange={setCalories} keyboardType="decimal-pad" />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}><Field label="Protein (g)" value={protein} onChange={setProtein} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Carbs (g)" value={carbs} onChange={setCarbs} keyboardType="decimal-pad" /></View>
          </View>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}><Field label="Fat (g)" value={fat} onChange={setFat} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Fiber (g)" value={fiber} onChange={setFiber} keyboardType="decimal-pad" /></View>
          </View>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}><Field label="Sugar (g)" value={sugar} onChange={setSugar} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Sodium (mg)" value={sodium} onChange={setSodium} keyboardType="decimal-pad" /></View>
          </View>
          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save & Continue</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput style={fieldStyles.input} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#636366" keyboardType={keyboardType} selectTextOnFocus />
    </View>
  );
}
