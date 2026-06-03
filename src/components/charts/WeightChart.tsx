import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { subDays, parseISO, isAfter, format } from 'date-fns';
import { Colors } from '../../constants/colors';
import type { WeightLog } from '../../types/weight';

interface Props {
  entries: WeightLog[];
  unit: string;
  days: 30 | 60 | 90;
  width: number;
}

const H = 180;
const PAD = { top: 16, bottom: 32, left: 40, right: 12 };

export function WeightChart({ entries, unit, days, width }: Props) {
  const W = width;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const filtered = useMemo(() => {
    const cutoff = subDays(new Date(), days);
    return entries
      .filter((e) => isAfter(parseISO(e.date), cutoff))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, days]);

  if (filtered.length === 0) {
    return (
      <View style={[styles.empty, { width: W, height: H }]}>
        <Text style={styles.emptyText}>No data for this period</Text>
      </View>
    );
  }

  const weights = filtered.map((e) => e.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const padding = rawMax === rawMin ? 1 : (rawMax - rawMin) * 0.1;
  const yMin = rawMin - padding;
  const yMax = rawMax + padding;

  function toX(i: number) {
    return PAD.left + (filtered.length === 1 ? innerW / 2 : (i / (filtered.length - 1)) * innerW);
  }

  function toY(w: number) {
    return PAD.top + innerH - ((w - yMin) / (yMax - yMin)) * innerH;
  }

  // Build smooth path using cubic bezier control points
  let d = '';
  for (let i = 0; i < filtered.length; i++) {
    const x = toX(i);
    const y = toY(filtered[i].weight);
    if (i === 0) {
      d += `M ${x} ${y}`;
    } else {
      const px = toX(i - 1);
      const py = toY(filtered[i - 1].weight);
      const cpx = (px + x) / 2;
      d += ` C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`;
    }
  }

  // Area path (fill under the line)
  const firstX = toX(0);
  const lastX = toX(filtered.length - 1);
  const baseY = PAD.top + innerH;
  const areaD = `${d} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

  // Y-axis labels
  const mid = (yMin + yMax) / 2;
  const yLabels = [yMax, mid, yMin];

  // X-axis labels: show first, middle, last
  const xLabelIndices =
    filtered.length <= 3
      ? filtered.map((_, i) => i)
      : [0, Math.floor((filtered.length - 1) / 2), filtered.length - 1];

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {yLabels.map((_, i) => {
          const y = toY(yLabels[i]);
          return (
            <Line
              key={i}
              x1={PAD.left}
              y1={y}
              x2={W - PAD.right}
              y2={y}
              stroke={Colors.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Area fill */}
        <Path d={areaD} fill="url(#areaGrad)" />

        {/* Line */}
        <Path d={d} stroke={Colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {filtered.map((e, i) => (
          <Circle
            key={e.id}
            cx={toX(i)}
            cy={toY(e.weight)}
            r={4}
            fill={Colors.primary}
            stroke={Colors.background}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Y-axis labels (overlaid) */}
      {yLabels.map((val, i) => (
        <Text
          key={i}
          style={[styles.yLabel, { top: toY(val) - 8 }]}
        >
          {val.toFixed(1)}
        </Text>
      ))}

      {/* X-axis labels */}
      {xLabelIndices.map((idx) => {
        const x = toX(idx);
        const label = format(parseISO(filtered[idx].date), 'MMM d');
        return (
          <Text
            key={idx}
            style={[styles.xLabel, { left: x - 20, top: H - PAD.bottom + 6 }]}
          >
            {label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: PAD.left - 4,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
    width: 40,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
