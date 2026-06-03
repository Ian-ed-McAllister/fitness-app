import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../src/styles/CreateMeal.styles';
import { searchFoods, getRecentFoods } from '../../src/db/food';
import { createSavedMeal } from '../../src/db/meals';
import { useNutritionStore } from '../../src/store/nutritionStore';
import type { FoodItem } from '../../src/types/nutrition';

interface DraftItem { food: FoodItem; servings: number; }

export default function CreateMealScreen() {
  useLocalSearchParams<{ mealSlot: string; date: string }>();
  const { selectedFoodForMeal, setSelectedFoodForMeal } = useNutritionStore();

  const [mealName, setMealName] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    if (selectedFoodForMeal) {
      if (!items.find((i) => i.food.id === selectedFoodForMeal.id)) {
        setItems((prev) => [...prev, { food: selectedFoodForMeal, servings: 1 }]);
      }
      setSelectedFoodForMeal(null);
    }
  }, [selectedFoodForMeal]));

  async function loadRecents() {
    setSearching(true);
    setSearchResults(await getRecentFoods(20));
    setSearching(false);
  }

  function openSearch() {
    setQuery('');
    loadRecents();
    setSearchVisible(true);
  }

  function onQueryChange(text: string) {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (!text.trim()) { loadRecents(); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      setSearchResults(await searchFoods(text.trim()));
      setSearching(false);
    }, 400);
  }

  function selectFood(food: FoodItem) {
    setSearchVisible(false);
    if (!items.find((i) => i.food.id === food.id)) {
      setItems((prev) => [...prev, { food, servings: 1 }]);
    }
  }

  function adjustServings(foodId: string, delta: number) {
    setItems((prev) => prev.map((item) =>
      item.food.id === foodId
        ? { ...item, servings: Math.max(0.25, Math.round((item.servings + delta) * 4) / 4) }
        : item
    ));
  }

  function removeItem(foodId: string) {
    setItems((prev) => prev.filter((i) => i.food.id !== foodId));
  }

  function getTotals() {
    return items.reduce(
      (acc, { food, servings }) => ({
        calories: acc.calories + food.calories * servings,
        protein: acc.protein + food.protein * servings,
        carbs: acc.carbs + food.carbs * servings,
        fat: acc.fat + food.fat * servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  async function handleSave() {
    if (!mealName.trim()) { Alert.alert('Required', 'Please enter a meal name.'); return; }
    if (items.length === 0) { Alert.alert('Required', 'Add at least one food item.'); return; }
    setSaving(true);
    try {
      await createSavedMeal(mealName.trim(), items.map((i) => ({ foodId: i.food.id, servings: i.servings })));
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save meal.');
    } finally {
      setSaving(false);
    }
  }

  const totals = getTotals();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Meal</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#00D26A" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.nameSection}>
          <TextInput style={styles.nameInput} placeholder="Meal name (e.g. Post-Workout)" placeholderTextColor="#636366" value={mealName} onChangeText={setMealName} />
        </View>

        {items.length > 0 && (
          <View style={styles.totalsBar}>
            <Text style={styles.totalsCal}>{Math.round(totals.calories)} kcal</Text>
            <Text style={styles.totalsMacro}>P {Math.round(totals.protein)}g</Text>
            <Text style={styles.totalsMacro}>C {Math.round(totals.carbs)}g</Text>
            <Text style={styles.totalsMacro}>F {Math.round(totals.fat)}g</Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(item) => item.food.id}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <TouchableOpacity style={styles.addFoodBtn} onPress={openSearch}>
              <Ionicons name="add-circle-outline" size={20} color="#00D26A" />
              <Text style={styles.addFoodText}>Add Food</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={<View style={styles.emptyItems}><Text style={styles.emptyText}>No foods added yet</Text></View>}
          renderItem={({ item }) => (
            <View style={styles.draftItem}>
              <View style={styles.draftLeft}>
                <Text style={styles.draftName} numberOfLines={1}>{item.food.name}</Text>
                <Text style={styles.draftCal}>{Math.round(item.food.calories * item.servings)} kcal</Text>
              </View>
              <View style={styles.draftControls}>
                <TouchableOpacity onPress={() => adjustServings(item.food.id, -0.25)} style={styles.stepBtn}>
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.servingsText}>{item.servings}</Text>
                <TouchableOpacity onPress={() => adjustServings(item.food.id, 0.25)} style={styles.stepBtn}>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.food.id)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={16} color="#FF453A" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      </KeyboardAvoidingView>

      <Modal visible={searchVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSearchVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalSearch}>
              <Ionicons name="search" size={15} color="#636366" />
              <TextInput style={styles.modalInput} placeholder="Search foods..." placeholderTextColor="#636366" value={query} onChangeText={onQueryChange} autoFocus />
            </View>
          </View>
          {searching ? (
            <ActivityIndicator color="#00D26A" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(i) => i.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.searchRow} onPress={() => selectFood(item)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchName}>{item.name}</Text>
                    {item.brand && <Text style={styles.searchBrand}>{item.brand}</Text>}
                  </View>
                  <Text style={styles.searchCal}>{Math.round(item.calories)} kcal</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
