import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface ProgressBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export function ProgressBar({ label, current, goal, color, unit = 'g' }: ProgressBarProps) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const over = current > goal;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        <Text style={styles.values}>
          <Text style={{ color: Colors.text }}>{Math.round(current)}</Text>
          <Text style={{ color: Colors.textMuted }}>/{Math.round(goal)}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: over ? Colors.danger : color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  values: {
    fontSize: 13,
  },
  track: {
    height: 6,
    backgroundColor: Colors.surface2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
