import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { CalorieBarChart } from '../../src/components/charts/CalorieBarChart';
import { WeightChart } from '../../src/components/charts/WeightChart';
import { getCaloriesHistory, type DayNutrition } from '../../src/db/food';
import { getWeightLogs } from '../../src/db/weight';
import { getWorkoutVolume, getTopExercisePRs, type WorkoutVolumeSummary, type ExercisePRSummary } from '../../src/db/workouts';
import { useNutritionStore } from '../../src/store/nutritionStore';
import type { WeightLog } from '../../src/types/weight';

type CalPeriod = 7 | 14 | 30;

export default function ProgressTab() {
  const { width } = useWindowDimensions();
  const { goals, loadGoals } = useNutritionStore();

  const [calPeriod, setCalPeriod] = useState<CalPeriod>(7);
  const [calHistory, setCalHistory] = useState<DayNutrition[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [volume, setVolume] = useState<WorkoutVolumeSummary>({ sessions: 0, sets: 0, daysActive: 0 });
  const [prs, setPRs] = useState<ExercisePRSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll(period: CalPeriod = calPeriod) {
    setLoading(true);
    try {
      const [cal, wt, vol, prList] = await Promise.all([
        getCaloriesHistory(period),
        getWeightLogs(90),
        getWorkoutVolume(30),
        getTopExercisePRs(8),
      ]);
      setCalHistory(cal);
      setWeightLogs(wt);
      setVolume(vol);
      setPRs(prList);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadGoals();
      loadAll();
    }, [calPeriod])
  );

  useEffect(() => {
    getCaloriesHistory(calPeriod).then(setCalHistory);
  }, [calPeriod]);

  // Compute macro averages over the period from calHistory
  const daysWithData = calHistory.filter((d) => d.calories > 0);
  const avgCalories =
    daysWithData.length > 0
      ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
      : 0;
  const avgProtein =
    daysWithData.length > 0
      ? Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length)
      : 0;
  const avgCarbs =
    daysWithData.length > 0
      ? Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / daysWithData.length)
      : 0;
  const avgFat =
    daysWithData.length > 0
      ? Math.round(daysWithData.reduce((s, d) => s + d.fat, 0) / daysWithData.length)
      : 0;

  const chartW = width - 32;

  const weightUnit = weightLogs[0]?.unit ?? 'kg';
  const weightForChart = [...weightLogs].reverse(); // WeightChart expects oldest-first

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Calories ─────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Calories</Text>
              <View style={styles.periodToggle}>
                {([7, 14, 30] as CalPeriod[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodBtn, calPeriod === p && styles.periodBtnActive]}
                    onPress={() => setCalPeriod(p)}
                  >
                    <Text style={[styles.periodBtnText, calPeriod === p && styles.periodBtnTextActive]}>
                      {p}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <CalorieBarChart data={calHistory} goal={goals.calories} days={calPeriod} width={chartW - 32} />
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                  <Text style={styles.legendText}>On track</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.legendText}>Over goal</Text>
                </View>
              </View>
            </View>

            {daysWithData.length > 0 && (
              <View style={styles.avgRow}>
                <AvgCell label="Avg Calories" value={`${avgCalories}`} unit="kcal" color={Colors.text} />
                <AvgCell label="Avg Protein" value={`${avgProtein}`} unit="g" color={Colors.protein} />
                <AvgCell label="Avg Carbs" value={`${avgCarbs}`} unit="g" color={Colors.carbs} />
                <AvgCell label="Avg Fat" value={`${avgFat}`} unit="g" color={Colors.fat} />
              </View>
            )}

            {daysWithData.length === 0 && (
              <EmptyHint text="Log some meals to see calorie trends" icon="restaurant-outline" />
            )}
          </View>

          {/* ── Body Weight ──────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Body Weight</Text>
            <View style={styles.card}>
              <WeightChart entries={weightForChart} unit={weightUnit} days={30} width={chartW - 32} />
            </View>
            {weightLogs.length === 0 && (
              <EmptyHint text="Log your weight to see trends here" icon="scale-outline" />
            )}
          </View>

          {/* ── Workouts ─────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workouts — Last 30 Days</Text>
            <View style={styles.statRow}>
              <StatBox value={volume.sessions} label="Sessions" icon="barbell-outline" />
              <StatBox value={volume.sets} label="Total Sets" icon="list-outline" />
              <StatBox value={volume.daysActive} label="Active Days" icon="calendar-outline" />
            </View>
          </View>

          {/* ── PRs ──────────────────────────────────────────────────── */}
          {prs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Records</Text>
              <View style={styles.card}>
                {prs.map((pr, i) => (
                  <React.Fragment key={pr.exerciseId}>
                    <TouchableOpacity
                      style={styles.prRow}
                      onPress={() =>
                        router.push({
                          pathname: '/workouts/exercise-progress',
                          params: { exerciseId: pr.exerciseId, exerciseName: pr.name },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.prLeft}>
                        <Text style={styles.prName} numberOfLines={1}>
                          {pr.name}
                        </Text>
                        {pr.muscleGroup && (
                          <Text style={styles.prMuscle}>{pr.muscleGroup}</Text>
                        )}
                      </View>
                      <View style={styles.prRight}>
                        <Text style={styles.prWeight}>{pr.pr}</Text>
                        <Text style={styles.prUnit}>kg</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                    {i < prs.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          {prs.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Records</Text>
              <EmptyHint text="Complete a workout with weights to see your PRs" icon="trophy-outline" />
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function AvgCell({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={styles.avgCell}>
      <Text style={[styles.avgValue, { color }]}>{value}</Text>
      <Text style={styles.avgUnit}>{unit}</Text>
      <Text style={styles.avgLabel}>{label}</Text>
    </View>
  );
}

function StatBox({ value, label, icon }: { value: number; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={22} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyHint({ text, icon }: { text: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={styles.emptyHint}>
      <Ionicons name={icon} size={28} color={Colors.textMuted} />
      <Text style={styles.emptyHintText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },

  periodToggle: { flexDirection: 'row', backgroundColor: Colors.surface2, borderRadius: 8, padding: 2, gap: 2 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  periodBtnTextActive: { color: Colors.textInverse },

  legendRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textMuted },

  avgRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  avgCell: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  avgValue: { fontSize: 18, fontWeight: '700' },
  avgUnit: { fontSize: 10, color: Colors.textMuted, marginTop: -2 },
  avgLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  statRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  prLeft: { flex: 1 },
  prName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  prMuscle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  prRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  prWeight: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  prUnit: { fontSize: 12, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border },

  emptyHint: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyHintText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
