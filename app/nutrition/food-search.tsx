import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../src/styles/FoodSearch.styles';
import { searchFoods, getRecentFoods } from '../../src/db/food';
import { useNutritionStore } from '../../src/store/nutritionStore';
import type { FoodItem } from '../../src/types/nutrition';

export default function FoodSearchScreen() {
  const { mealSlot, date, mode } = useLocalSearchParams<{ mealSlot: string; date: string; mode?: string }>();
  const setSelectedFoodForMeal = useNutritionStore((s) => s.setSelectedFoodForMeal);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadRecent(); }, []);

  async function loadRecent() {
    setLoading(true);
    setResults(await getRecentFoods(20));
    setLoading(false);
  }

  function onQueryChange(text: string) {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (!text.trim()) { loadRecent(); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      setResults(await searchFoods(text.trim()));
      setLoading(false);
    }, 400);
  }

  function selectFood(food: FoodItem) {
    if (mode === 'meal') {
      setSelectedFoodForMeal(food);
      router.back();
    } else {
      router.push({ pathname: '/nutrition/food-detail', params: { foodId: food.id, mealSlot, date } });
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#636366" />
          <TextInput
            style={styles.input}
            placeholder="Search foods..."
            placeholderTextColor="#636366"
            value={query}
            onChangeText={onQueryChange}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); loadRecent(); }}>
              <Ionicons name="close-circle" size={16} color="#636366" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#00D26A" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              {query.trim() ? `Results for "${query}"` : 'Recently Used'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No foods found</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push({ pathname: '/nutrition/manual-entry', params: { mealSlot, date } })}
              >
                <Text style={styles.createBtnText}>Create custom food</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => selectFood(item)} activeOpacity={0.7}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                {item.brand && <Text style={styles.rowBrand} numberOfLines={1}>{item.brand}</Text>}
                <Text style={styles.rowServing}>per {item.servingSize}{item.servingUnit}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowCal}>{Math.round(item.calories)}</Text>
                <Text style={styles.rowCalUnit}>kcal</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </SafeAreaView>
  );
}
