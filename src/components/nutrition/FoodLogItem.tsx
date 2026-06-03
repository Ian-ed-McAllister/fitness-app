import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { styles } from '../../styles/FoodLogItem.styles';
import type { FoodLogEntry } from '../../types/nutrition';

interface Props {
  entry: FoodLogEntry;
  onPress: () => void;
  onDelete: () => void;
}

export function FoodLogItem({ entry, onPress, onDelete }: Props) {
  const { food, servings } = entry;
  const totalCal = Math.round(food.calories * servings);
  const totalProtein = Math.round(food.protein * servings * 10) / 10;
  const totalCarbs = Math.round(food.carbs * servings * 10) / 10;
  const totalFat = Math.round(food.fat * servings * 10) / 10;

  const servingLabel =
    servings === 1
      ? `${food.servingSize}${food.servingUnit}`
      : `${servings} × ${food.servingSize}${food.servingUnit}`;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>{food.name}</Text>
        <Text style={styles.serving}>{servingLabel}</Text>
        <View style={styles.macros}>
          <Text style={[styles.macro, { color: Colors.protein }]}>P {totalProtein}g</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.macro, { color: Colors.carbs }]}>C {totalCarbs}g</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.macro, { color: Colors.fat }]}>F {totalFat}g</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.cal}>{totalCal}</Text>
        <Text style={styles.calUnit}>kcal</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={12}>
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
