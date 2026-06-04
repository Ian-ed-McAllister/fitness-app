import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';
import { Colors } from '../../constants/colors';
import type { DayNutrition } from '../../db/food';

interface Props {
  data: DayNutrition[];
  goal: number;
  days: number;
  width: number;
}

const H = 160;
const PAD = { top: 12, bottom: 28, left: 4, right: 4 };

export function CalorieBarChart({ data, goal, days, width }: Props) {
  const W = width;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const fullData = useMemo(() => {
    const today = new Date();
    const allDays = eachDayOfInterval({ start: subDays(today, days - 1), end: today });
    const map = new Map(data.map((d) => [d.date, d.calories]));
    return allDays.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      return { date: dateStr, calories: map.get(dateStr) ?? 0 };
    });
  }, [data, days]);

  const maxCal = Math.max(goal * 1.25, ...fullData.map((d) => d.calories), 1);
  const barW = (innerW / fullData.length) * 0.55;
  const slotW = innerW / fullData.length;

  function toY(cal: number) {
    return PAD.top + innerH - (cal / maxCal) * innerH;
  }

  const goalY = toY(goal);

  // Show label every N bars so they don't overlap
  const labelEvery = days <= 7 ? 1 : days <= 14 ? 2 : Math.ceil(days / 7);

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H}>
        {/* Goal dashed line */}
        <Line
          x1={PAD.left}
          y1={goalY}
          x2={W - PAD.right}
          y2={goalY}
          stroke={Colors.primary}
          strokeWidth={1}
          strokeDasharray="4,3"
          opacity={0.45}
        />

        {fullData.map((d, i) => {
          const x = PAD.left + i * slotW + (slotW - barW) / 2;
          const barH = Math.max(2, (d.calories / maxCal) * innerH);
          const y = PAD.top + innerH - barH;
          const isToday = i === fullData.length - 1;
          const overGoal = d.calories > 0 && d.calories > goal;
          const isEmpty = d.calories === 0;
          const fill = isEmpty
            ? Colors.surface3
            : overGoal
            ? Colors.danger
            : isToday
            ? Colors.primary
            : Colors.primaryDark;
          return (
            <Rect
              key={d.date}
              x={x}
              y={isEmpty ? PAD.top + innerH - 2 : y}
              width={barW}
              height={isEmpty ? 2 : barH}
              rx={3}
              fill={fill}
              opacity={isEmpty ? 0.25 : 1}
            />
          );
        })}
      </Svg>

      {/* X-axis labels */}
      {fullData.map((d, i) => {
        const show = i % labelEvery === 0 || i === fullData.length - 1;
        if (!show) return null;
        const x = PAD.left + i * slotW + slotW / 2;
        const isToday = i === fullData.length - 1;
        const label = isToday ? 'Today' : format(parseISO(d.date), days <= 14 ? 'EEE' : 'M/d');
        return (
          <Text key={d.date} style={[styles.xLabel, { left: x - 16 }]}>
            {label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  xLabel: {
    position: 'absolute',
    top: H - PAD.bottom + 6,
    width: 32,
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
