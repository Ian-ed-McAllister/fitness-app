import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../constants/colors';
import { styles } from '../../styles/ProgressBar.styles';

interface ProgressBarProps {
  label?: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
  height?: number;
}

export function ProgressBar({ label, current, goal, color, unit = 'g', height = 6 }: ProgressBarProps) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const over = current > goal;

  return (
    <View style={styles.container}>
      {label != null && (
        <View style={styles.row}>
          <Text style={[styles.label, { color }]}>{label}</Text>
          <Text style={styles.values}>
            <Text style={{ color: Colors.text }}>{Math.round(current)}</Text>
            <Text style={{ color: Colors.textMuted }}>/{Math.round(goal)}{unit}</Text>
          </Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
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
