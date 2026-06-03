import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../src/styles/AddFood.styles';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Option {
  icon: IoniconsName;
  label: string;
  description: string;
  route: string;
}

const OPTIONS: Option[] = [
  { icon: 'barcode-outline', label: 'Scan Barcode', description: 'Scan a product barcode', route: '/nutrition/barcode-scan' },
  { icon: 'search-outline', label: 'Search Foods', description: 'Search the food library', route: '/nutrition/food-search' },
  { icon: 'create-outline', label: 'Manual Entry', description: 'Create a custom food', route: '/nutrition/manual-entry' },
  { icon: 'restaurant-outline', label: 'Saved Meals', description: 'Log a saved meal combo', route: '/nutrition/saved-meals' },
];

export default function AddFoodScreen() {
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot: string; date: string }>();

  function navigate(route: string) {
    router.push({ pathname: route as any, params: { mealSlot, date } });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Food</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.label} style={styles.option} onPress={() => navigate(opt.route)} activeOpacity={0.75}>
            <View style={styles.iconWrap}>
              <Ionicons name={opt.icon} size={26} color="#00D26A" />
            </View>
            <View style={styles.optText}>
              <Text style={styles.optLabel}>{opt.label}</Text>
              <Text style={styles.optDesc}>{opt.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#636366" />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
