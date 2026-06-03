import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { styles } from '../../styles/MacroRing.styles';

interface Props {
  calories: number;
  goalCalories: number;
}

const RADIUS = 78;
const STROKE = 14;
const SIZE = (RADIUS + STROKE) * 2 + 4;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function MacroRing({ calories, goalCalories }: Props) {
  const pct = goalCalories > 0 ? clamp(calories / goalCalories, 0, 1) : 0;
  const over = calories > goalCalories;
  const remaining = Math.max(0, goalCalories - calories);

  const arcColor = over ? Colors.danger : pct > 0.85 ? Colors.warning : Colors.primary;
  const dashLen = pct * CIRCUMFERENCE;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <G transform={`rotate(-90, ${CENTER}, ${CENTER})`}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={Colors.surface2}
            strokeWidth={STROKE}
            fill="none"
          />
          {pct > 0 && (
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={arcColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={[dashLen, CIRCUMFERENCE - dashLen]}
              strokeLinecap="round"
            />
          )}
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{Math.round(calories)}</Text>
        <Text style={styles.unit}>kcal</Text>
        <Text style={[styles.sub, over && styles.subOver]}>
          {over
            ? `${Math.round(calories - goalCalories)} over`
            : `${Math.round(remaining)} left`}
        </Text>
      </View>
    </View>
  );
}
