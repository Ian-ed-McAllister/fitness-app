import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { styles } from '../../styles/MealSection.styles';
import { FoodLogItem } from './FoodLogItem';
import type { FoodLogEntry, MealSlot } from '../../types/nutrition';
import { DEFAULT_SLOT_LABELS } from '../../types/nutrition';

function slotLabel(slot: string) {
  return DEFAULT_SLOT_LABELS[slot] ?? slot;
}

interface Props {
  slot: MealSlot;
  entries: FoodLogEntry[];
  onAdd: () => void;
  onDelete?: () => void;
  onEntryPress: (entry: FoodLogEntry) => void;
  onEntryDelete: (entry: FoodLogEntry) => void;
}

export function MealSection({ slot, entries, onAdd, onDelete, onEntryPress, onEntryDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const totalCal = entries.reduce((s, e) => s + e.food.calories * e.servings, 0);
  const isCustom = !DEFAULT_SLOT_LABELS[slot];

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-down'}
            size={14}
            color={Colors.textMuted}
            style={styles.chevron}
          />
          <Text style={styles.title}>{slotLabel(slot)}</Text>
          {totalCal > 0 && (
            <Text style={styles.slotCal}>{Math.round(totalCal)} kcal</Text>
          )}
        </View>
        <View style={styles.actions}>
          {isCustom && onDelete && (
            <TouchableOpacity onPress={onDelete} hitSlop={10} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} hitSlop={10}>
            <Ionicons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.items}>
          {entries.length === 0 ? (
            <Text style={styles.empty}>No foods logged</Text>
          ) : (
            entries.map((entry, i) => (
              <React.Fragment key={entry.id}>
                {i > 0 && <View style={styles.divider} />}
                <FoodLogItem
                  entry={entry}
                  onPress={() => onEntryPress(entry)}
                  onDelete={() => onEntryDelete(entry)}
                />
              </React.Fragment>
            ))
          )}
        </View>
      )}
    </View>
  );
}
