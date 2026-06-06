import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { ProgressBar } from '../../src/components/ui';
import { useProfileStore } from '../../src/store/profileStore';
import { useWeightStore } from '../../src/store/weightStore';
import { calculateTDEE, suggestedCalories, suggestedMacros, ageFromDOB, BODY_GOAL_LABELS, ACTIVITY_LABELS } from '../../src/utils/tdee';
import { useNutritionStore } from '../../src/store/nutritionStore';
import { useState } from 'react';

export default function ProfileTab() {
  const {
    displayName,
    dateOfBirth,
    biologicalSex,
    heightCm,
    goalWeight,
    bodyGoal,
    activityLevel,
    weeklyWorkoutTarget,
    waterGoalMl,
    todayWaterMl,
    loggingStreak,
    workoutStreak,
    waterStreak,
    weeklySessionCount,
    loadProfile,
  } = useProfileStore();

  const { entries: weightEntries } = useWeightStore();
  const { goals, updateGoals } = useNutritionStore();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const currentWeight = weightEntries[0]?.weight ?? null;
  const weightUnit = weightEntries[0]?.unit ?? 'kg';

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  // TDEE estimate — only if we have the required fields
  const tdee =
    currentWeight && heightCm && dateOfBirth && biologicalSex
      ? calculateTDEE({
          weightKg: currentWeight,
          heightCm,
          ageYears: ageFromDOB(dateOfBirth),
          sex: biologicalSex,
          activityLevel,
        })
      : null;
  const suggested = tdee ? suggestedCalories(tdee, bodyGoal) : null;

  const initials = displayName
    ? displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Goal weight progress
  const weightProgress =
    currentWeight && goalWeight && currentWeight !== goalWeight
      ? Math.min(1, Math.abs(currentWeight - goalWeight) === 0
          ? 1
          : 1 - Math.abs(currentWeight - goalWeight) / Math.max(currentWeight, goalWeight))
      : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Avatar + identity card ────────────────────────────── */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.name}>{displayName || 'Set your name'}</Text>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>{BODY_GOAL_LABELS[bodyGoal]}</Text>
            </View>
            {currentWeight && (
              <Text style={styles.weightLine}>
                {currentWeight} {weightUnit}
                {goalWeight ? ` · Goal: ${goalWeight} ${weightUnit}` : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/profile/edit-profile')}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Goal weight progress ──────────────────────────────── */}
        {currentWeight && goalWeight && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Goal Progress</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{currentWeight} {weightUnit}</Text>
              <Text style={styles.progressLabel}>{goalWeight} {weightUnit}</Text>
            </View>
            <ProgressBar
              current={currentWeight}
              goal={goalWeight}
              color={Colors.primary}
              height={8}
            />
            <Text style={styles.progressSub}>
              {Math.abs(currentWeight - goalWeight).toFixed(1)} {weightUnit} to go
            </Text>
          </View>
        )}

        {/* ── TDEE card ─────────────────────────────────────────── */}
        {tdee ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estimated Daily Burn</Text>
            <Text style={styles.tdeeValue}>{tdee.toLocaleString()} <Text style={styles.tdeeUnit}>kcal</Text></Text>
            <Text style={styles.tdeeSub}>{ACTIVITY_LABELS[activityLevel]} · {BODY_GOAL_LABELS[bodyGoal]}</Text>
            {suggested && (
              <>
                <View style={styles.tdeeRow}>
                  <View style={styles.tdeeCol}>
                    <Text style={styles.tdeeColVal}>{suggested.toLocaleString()}</Text>
                    <Text style={styles.tdeeColLabel}>Suggested goal</Text>
                  </View>
                  <View style={styles.tdeeCol}>
                    <Text style={[styles.tdeeColVal, { color: goals.calories !== suggested ? Colors.warning : Colors.primary }]}>
                      {goals.calories.toLocaleString()}
                    </Text>
                    <Text style={styles.tdeeColLabel}>Current goal</Text>
                  </View>
                </View>
                {goals.calories !== suggested && (
                  <TouchableOpacity
                    style={[styles.applyBtn, applying && { opacity: 0.6 }]}
                    disabled={applying}
                    onPress={async () => {
                      if (!currentWeight) return;
                      setApplying(true);
                      const macros = suggestedMacros(suggested, currentWeight);
                      await updateGoals({ calories: suggested, ...macros });
                      setApplying(false);
                      setApplied(true);
                      setTimeout(() => setApplied(false), 2000);
                    }}
                  >
                    <Ionicons
                      name={applied ? 'checkmark-circle' : 'flash'}
                      size={15}
                      color={Colors.textInverse}
                    />
                    <Text style={styles.applyBtnText}>
                      {applied ? 'Applied!' : `Set to ${suggested.toLocaleString()} kcal`}
                    </Text>
                  </TouchableOpacity>
                )}
                {goals.calories === suggested && (
                  <View style={styles.appliedRow}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                    <Text style={styles.appliedText}>Goal matches estimate</Text>
                  </View>
                )}
              </>
            )}
            {!tdee && (
              <TouchableOpacity onPress={() => router.push('/profile/edit-profile')}>
                <Text style={styles.tdeeCta}>Add height, DOB & sex to see your estimate →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/profile/edit-profile')} activeOpacity={0.7}>
            <View style={styles.tdeePlaceholder}>
              <Ionicons name="flash-outline" size={24} color={Colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Estimated Daily Burn</Text>
                <Text style={styles.tdeeCta}>Add height, DOB & sex to see your calorie burn estimate</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Streaks ───────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Streaks</Text>
        <View style={styles.streakRow}>
          <StreakCard value={loggingStreak} label="Logging" icon="restaurant-outline" color={Colors.carbs} />
          <StreakCard value={workoutStreak} label="Workouts" icon="barbell-outline" color={Colors.primary} />
          <StreakCard value={waterStreak} label="Hydration" icon="water-outline" color="#4FC3F7" />
        </View>

        {/* ── Weekly workout target ─────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.cardTitle}>This Week</Text>
            <Text style={styles.weeklyCount}>
              <Text style={styles.weeklyDone}>{weeklySessionCount}</Text>
              /{weeklyWorkoutTarget} workouts
            </Text>
          </View>
          <ProgressBar
            current={weeklySessionCount}
            goal={weeklyWorkoutTarget}
            color={Colors.primary}
            height={8}
          />
          {weeklySessionCount >= weeklyWorkoutTarget ? (
            <Text style={styles.weeklyComplete}>Goal reached! 🎯</Text>
          ) : (
            <Text style={styles.weeklySub}>
              {weeklyWorkoutTarget - weeklySessionCount} more to hit your target
            </Text>
          )}
        </View>

        {/* ── Quick actions ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.actionsCard}>
          <ActionRow
            icon="person-outline"
            label="Edit Profile"
            sub="Name, height, DOB, sex"
            onPress={() => router.push('/profile/edit-profile')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="flag-outline"
            label="Body Goals"
            sub={`${BODY_GOAL_LABELS[bodyGoal]} · ${ACTIVITY_LABELS[activityLevel]}`}
            onPress={() => router.push('/profile/body-goals')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="nutrition-outline"
            label="Nutrition Goals"
            sub={`${goals.calories} kcal · ${goals.protein}P ${goals.carbs}C ${goals.fat}F`}
            onPress={() => router.push('/nutrition/settings')}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StreakCard({ value, label, icon, color }: {
  value: number; label: string;
  icon: React.ComponentProps<typeof Ionicons>['name']; color: string;
}) {
  return (
    <View style={styles.streakCard}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.streakValue, { color }]}>{value}</Text>
      <Text style={styles.streakLabel}>{label}</Text>
      <Text style={styles.streakUnit}>day streak</Text>
    </View>
  );
}

function ActionRow({ icon, label, sub, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; sub: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSub} numberOfLines={1}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },

  identityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  identityInfo: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text },
  goalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  goalBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  weightLine: { fontSize: 13, color: Colors.textMuted },
  editBtn: { padding: 4 },

  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, color: Colors.textMuted },
  progressSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'right' },

  tdeeValue: { fontSize: 36, fontWeight: '800', color: Colors.text },
  tdeeUnit: { fontSize: 16, fontWeight: '400', color: Colors.textMuted },
  tdeeSub: { fontSize: 13, color: Colors.textMuted },
  tdeeRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  tdeeCol: { flex: 1, backgroundColor: Colors.surface2, borderRadius: 10, padding: 10, gap: 2 },
  tdeeColVal: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  tdeeColLabel: { fontSize: 11, color: Colors.textMuted },
  tdeePlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tdeeCta: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 10, marginTop: 4,
  },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textInverse },
  appliedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  appliedText: { fontSize: 13, color: Colors.primary },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 },

  streakRow: { flexDirection: 'row', gap: 10 },
  streakCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  streakValue: { fontSize: 28, fontWeight: '800' },
  streakLabel: { fontSize: 12, fontWeight: '600', color: Colors.text },
  streakUnit: { fontSize: 10, color: Colors.textMuted },

  weeklyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyCount: { fontSize: 14, color: Colors.textMuted },
  weeklyDone: { fontWeight: '700', color: Colors.primary },
  weeklyComplete: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  weeklySub: { fontSize: 12, color: Colors.textMuted },

  actionsCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  actionIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 15, fontWeight: '500', color: Colors.text },
  actionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
});
