import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../src/styles/SavedMeals.styles';
import { getSavedMeals, deleteSavedMeal } from '../../src/db/meals';
import { addFoodLog } from '../../src/db/food';
import type { SavedMeal, MealSlot } from '../../src/types/nutrition';

export default function SavedMealsScreen() {
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot: string; date: string }>();
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    setMeals(await getSavedMeals());
    setLoading(false);
  }

  async function logMeal(meal: SavedMeal) {
    setLogging(meal.id);
    try {
      for (const item of meal.items) {
        await addFoodLog({ foodId: item.foodId, date, mealSlot: mealSlot as MealSlot, servings: item.servings });
      }
      router.navigate('/(tabs)/');
    } catch {
      Alert.alert('Error', 'Could not log meal.');
    } finally {
      setLogging(null);
    }
  }

  function confirmDelete(meal: SavedMeal) {
    Alert.alert('Delete Meal', `Delete "${meal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteSavedMeal(meal.id);
        setMeals((prev) => prev.filter((m) => m.id !== meal.id));
      }},
    ]);
  }

  function getMealTotals(meal: SavedMeal) {
    return meal.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.food.calories * item.servings,
        protein: acc.protein + item.food.protein * item.servings,
        carbs: acc.carbs + item.food.carbs * item.servings,
        fat: acc.fat + item.food.fat * item.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Meals</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/nutrition/create-meal', params: { mealSlot, date } })} hitSlop={12}>
          <Ionicons name="add" size={26} color="#00D26A" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color="#00D26A" /></View>
      ) : meals.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No saved meals yet</Text>
          <Text style={styles.emptyDesc}>Create a meal combo to log multiple foods at once.</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push({ pathname: '/nutrition/create-meal', params: { mealSlot, date } })}>
            <Text style={styles.createBtnText}>Create Meal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const totals = getMealTotals(item);
            const isLogging = logging === item.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardItems}>{item.items.length} items</Text>
                  </View>
                  <View style={styles.cardMacros}>
                    <Text style={styles.cardCal}>{Math.round(totals.calories)} kcal</Text>
                    <Text style={styles.macroChip}>P {Math.round(totals.protein)}g</Text>
                    <Text style={styles.macroChip}>C {Math.round(totals.carbs)}g</Text>
                    <Text style={styles.macroChip}>F {Math.round(totals.fat)}g</Text>
                  </View>
                </View>
                {item.items.slice(0, 3).map((fi) => (
                  <Text key={fi.id} style={styles.ingredient} numberOfLines={1}>
                    • {fi.food.name}{fi.servings !== 1 ? ` (×${fi.servings})` : ''}
                  </Text>
                ))}
                {item.items.length > 3 && <Text style={styles.moreItems}>+{item.items.length - 3} more</Text>}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.deleteAction} onPress={() => confirmDelete(item)}>
                    <Ionicons name="trash-outline" size={18} color="#FF453A" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.logBtn, isLogging && styles.logBtnDisabled]} onPress={() => logMeal(item)} disabled={isLogging}>
                    {isLogging ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.logBtnText}>Log Meal</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
