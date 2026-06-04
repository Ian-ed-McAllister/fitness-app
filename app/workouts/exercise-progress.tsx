import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { format } from 'date-fns';
import { Colors } from '../../src/constants/colors';
import { getExerciseProgressHistory, type ExerciseSessionPoint } from '../../src/db/workouts';
import { styles } from '../../src/styles/ExerciseProgress.styles';

const CHART_H = 180;
const PAD = { top: 16, bottom: 32, left: 40, right: 12 };

export default function ExerciseProgressScreen() {
  const router = useRouter();
  const { exerciseId, exerciseName, exerciseMeta } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
    exerciseMeta?: string;
  }>();
  const { width } = useWindowDimensions();
  const chartWidth = width - 32;

  const [data, setData] = useState<ExerciseSessionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const history = await getExerciseProgressHistory(exerciseId);
        setData(history);
      } finally {
        setLoading(false);
      }
    })();
  }, [exerciseId]);

  const pr = useMemo(() => (data.length ? Math.max(...data.map((d) => d.maxWeight)) : null), [data]);
  const last = data.length ? data[data.length - 1].maxWeight : null;
  const sessions = data.length;

  // Reversed for history list (newest first)
  const reversed = useMemo(() => [...data].reverse(), [data]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{exerciseName}</Text>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptyDesc}>
            Complete a workout that includes {exerciseName} and log some weights to see your progress here.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.hero}>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            {exerciseMeta ? <Text style={styles.exerciseMeta}>{exerciseMeta}</Text> : null}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, styles.prVal]}>{pr ?? '—'}</Text>
              <Text style={styles.statUnit}>kg</Text>
              <Text style={styles.statLabel}>All-time PR</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{last ?? '—'}</Text>
              <Text style={styles.statUnit}>kg</Text>
              <Text style={styles.statLabel}>Last Session</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{sessions}</Text>
              <Text style={styles.statUnit}> </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Max Weight Over Time</Text>
            <ProgressChart data={data} width={chartWidth} />
          </View>

          {/* History */}
          <Text style={styles.sectionTitle}>Session History</Text>
          {reversed.map((point) => (
            <View key={point.sessionId} style={styles.sessionCard}>
              <View style={styles.sessionLeft}>
                <Text style={styles.sessionDate}>
                  {format(new Date(point.startedAt), 'EEE, MMM d, yyyy')}
                </Text>
                <Text style={styles.sessionSets}>
                  {point.totalSets} set{point.totalSets !== 1 ? 's' : ''} · best {point.bestReps} rep{point.bestReps !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.sessionWeight}>
                {point.maxWeight}
                <Text style={styles.sessionUnit}> kg</Text>
              </Text>
              {point.isPR && (
                <View style={styles.prBadge}>
                  <Text style={styles.prBadgeText}>PR</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function ProgressChart({ data, width: W }: { data: ExerciseSessionPoint[]; width: number }) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const weights = data.map((d) => d.maxWeight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const padding = rawMax === rawMin ? Math.max(rawMax * 0.1, 1) : (rawMax - rawMin) * 0.15;
  const yMin = rawMin - padding;
  const yMax = rawMax + padding;

  function toX(i: number) {
    return PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  }
  function toY(w: number) {
    return PAD.top + innerH - ((w - yMin) / (yMax - yMin)) * innerH;
  }

  // Smooth bezier line
  let linePath = '';
  for (let i = 0; i < data.length; i++) {
    const x = toX(i);
    const y = toY(data[i].maxWeight);
    if (i === 0) {
      linePath += `M ${x} ${y}`;
    } else {
      const px = toX(i - 1);
      const py = toY(data[i - 1].maxWeight);
      const cpx = (px + x) / 2;
      linePath += ` C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`;
    }
  }

  const baseY = PAD.top + innerH;
  const areaPath = `${linePath} L ${toX(data.length - 1)} ${baseY} L ${toX(0)} ${baseY} Z`;

  const yLabels = [yMax, (yMin + yMax) / 2, yMin];
  const xIndices =
    data.length <= 3
      ? data.map((_, i) => i)
      : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <View style={{ width: W, height: CHART_H }}>
      <Svg width={W} height={CHART_H}>
        <Defs>
          <LinearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {yLabels.map((_, i) => (
          <Line
            key={i}
            x1={PAD.left} y1={toY(yLabels[i])}
            x2={W - PAD.right} y2={toY(yLabels[i])}
            stroke={Colors.border} strokeWidth={1}
          />
        ))}

        <Path d={areaPath} fill="url(#exGrad)" />
        <Path d={linePath} stroke={Colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((point, i) => (
          <Circle
            key={point.sessionId}
            cx={toX(i)} cy={toY(point.maxWeight)}
            r={point.isPR ? 5 : 3.5}
            fill={point.isPR ? Colors.primary : Colors.background}
            stroke={Colors.primary}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {yLabels.map((val, i) => (
        <Text key={i} style={[styles.yLabel, { top: toY(val) - 8 }]}>
          {val.toFixed(0)}
        </Text>
      ))}

      {xIndices.map((idx) => (
        <Text key={idx} style={[styles.xLabel, { left: toX(idx) - 22, top: CHART_H - PAD.bottom + 6 }]}>
          {format(new Date(data[idx].startedAt), 'MMM d')}
        </Text>
      ))}
    </View>
  );
}
