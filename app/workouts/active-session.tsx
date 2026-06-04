import React, { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useWorkoutStore } from '../../src/store/workoutStore';
import type { Exercise } from '../../src/types/workout';
import { styles } from '../../src/styles/ActiveSession.styles';
import { sheetStyles } from '../../src/styles/Sheet.styles';

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { mode, templateId, templateName } = useLocalSearchParams<{
    mode?: string;
    templateId?: string;
    templateName?: string;
  }>();

  const { templates, activeSession, startSession, logActiveSet, finishActiveSession, discardActiveSession } =
    useWorkoutStore();

  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [noSetsVisible, setNoSetsVisible] = useState(false);
  const [notes, setNotes] = useState('');
  // inputs: exerciseId → { weight: string; reps: string }
  const [inputs, setInputs] = useState<Record<string, { weight: string; reps: string }>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start session if none is active and we have params
  useEffect(() => {
    if (!activeSession && !starting) {
      initSession();
    }
  }, []);

  // Timer
  useEffect(() => {
    if (!activeSession) return;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeSession.startedAt) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession?.startedAt]);

  async function initSession() {
    setStarting(true);
    try {
      if (mode === 'empty') {
        await startSession(null, 'Empty Workout');
      } else if (templateId) {
        const template = templates.find((t) => t.id === templateId);
        if (template) await startSession(template);
      }
    } finally {
      setStarting(false);
    }
  }

  function formatElapsed(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(sec)}`;
    }
    return `${pad(m)}:${pad(sec)}`;
  }

  function pad(n: number) {
    return String(n).padStart(2, '0');
  }

  function setInput(exerciseId: string, field: 'weight' | 'reps', value: string) {
    setInputs((prev) => ({
      ...prev,
      [exerciseId]: { weight: '', reps: '', ...prev[exerciseId], [field]: value },
    }));
  }

  async function handleLogSet(exerciseId: string) {
    if (!activeSession) return;
    const input = inputs[exerciseId] ?? { weight: '', reps: '' };
    const nextSetIndex = (activeSession.loggedSets[exerciseId]?.length ?? 0);
    const prevData = activeSession.previousSets[exerciseId]?.[nextSetIndex];

    const weightStr = (input.weight ?? '').trim() || String(prevData?.weight ?? '');
    const repsStr = (input.reps ?? '').trim() || String(prevData?.reps ?? '');

    const weight = weightStr ? parseFloat(weightStr) : undefined;
    const reps = repsStr ? parseInt(repsStr, 10) : undefined;

    await logActiveSet(exerciseId, reps, weight);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Pre-fill weight with what was just logged, clear reps
    setInputs((prev) => ({
      ...prev,
      [exerciseId]: { weight: weightStr, reps: '' },
    }));
  }

  function handleDiscard() {
    setDiscardVisible(true);
  }

  async function handleFinish() {
    if (!activeSession) return;
    const totalSets = Object.values(activeSession.loggedSets).reduce((n, arr) => n + arr.length, 0);
    if (totalSets === 0) { setNoSetsVisible(true); return; }
    setFinishModalVisible(true);
  }

  async function confirmFinish() {
    await finishActiveSession(notes.trim() || undefined);
    setFinishModalVisible(false);
    router.back();
  }

  function handleAddExercise() {
    router.push({ pathname: '/workouts/exercise-search', params: { returnTo: 'session' } });
  }

  if (!activeSession && starting) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textMuted, fontSize: 15 }}>Starting workout…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textMuted, fontSize: 15 }}>No active session</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: Colors.primary, fontSize: 15 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalLogged = Object.values(activeSession.loggedSets).reduce((n, arr) => n + arr.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDiscard}>
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName} numberOfLines={1}>{activeSession.name}</Text>
          <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >

          {activeSession.exercises.length === 0 ? (
            <View style={styles.emptyExercises}>
              <Ionicons name="barbell-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyExTitle}>No Exercises</Text>
              <Text style={styles.emptyExDesc}>Tap "Add Exercise" to add your first exercise to this workout.</Text>
            </View>
          ) : (
            activeSession.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                plannedSets={activeSession.plannedSets[exercise.id] ?? 3}
                loggedSets={activeSession.loggedSets[exercise.id] ?? []}
                previousSets={activeSession.previousSets[exercise.id] ?? []}
                input={inputs[exercise.id] ?? { weight: '', reps: '' }}
                onWeightChange={(v) => setInput(exercise.id, 'weight', v)}
                onRepsChange={(v) => setInput(exercise.id, 'reps', v)}
                onLog={() => handleLogSet(exercise.id)}
              />
            ))
          )}

          <TouchableOpacity style={styles.addExBtn} onPress={handleAddExercise}>
            <Ionicons name="add" size={20} color={Colors.textSecondary} />
            <Text style={styles.addExText}>Add Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.finishWorkoutBtn} onPress={handleFinish}>
            <Text style={styles.finishWorkoutText}>
              Finish Workout{totalLogged > 0 ? ` · ${totalLogged} sets` : ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Discard sheet */}
      <Modal visible={discardVisible} transparent animationType="slide" onRequestClose={() => setDiscardVisible(false)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setDiscardVisible(false)}>
          <TouchableOpacity style={sheetStyles.sheet} activeOpacity={1}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.title}>Discard Workout?</Text>
            <Text style={sheetStyles.subtitle}>All logged sets will be permanently lost.</Text>
            <TouchableOpacity style={sheetStyles.dangerBtn} onPress={async () => { setDiscardVisible(false); await discardActiveSession(); router.back(); }}>
              <Ionicons name="trash-outline" size={18} color={Colors.textInverse} />
              <Text style={sheetStyles.dangerBtnText}>Discard Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sheetStyles.cancel} onPress={() => setDiscardVisible(false)}>
              <Text style={sheetStyles.cancelText}>Keep Going</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* No sets sheet */}
      <Modal visible={noSetsVisible} transparent animationType="slide" onRequestClose={() => setNoSetsVisible(false)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setNoSetsVisible(false)}>
          <TouchableOpacity style={sheetStyles.sheet} activeOpacity={1}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.title}>No Sets Logged</Text>
            <Text style={sheetStyles.subtitle}>Log at least one set before finishing, or discard this workout.</Text>
            <TouchableOpacity style={[sheetStyles.dangerBtn, { backgroundColor: Colors.surface2 }]} onPress={() => setNoSetsVisible(false)}>
              <Text style={[sheetStyles.dangerBtnText, { color: Colors.text }]}>Keep Going</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sheetStyles.cancel} onPress={async () => { setNoSetsVisible(false); await discardActiveSession(); router.back(); }}>
              <Text style={[sheetStyles.cancelText, { color: Colors.danger }]}>Discard Workout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Finish modal */}
      <Modal
        visible={finishModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFinishModalVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setFinishModalVisible(false)}
          >
            <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Finish Workout</Text>
              <Text style={styles.modalSubtitle}>
                {totalLogged} set{totalLogged !== 1 ? 's' : ''} logged · {formatElapsed(elapsed)}
              </Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Notes (optional)"
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
              <TouchableOpacity style={styles.modalFinishBtn} onPress={confirmFinish}>
                <Text style={styles.modalFinishText}>Save Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setFinishModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise;
  plannedSets: number;
  loggedSets: Array<{ id: string; setNumber: number; reps?: number; weight?: number; isPR: boolean }>;
  previousSets: Array<{ setNumber: number; reps?: number; weight?: number }>;
  input: { weight: string; reps: string };
  onWeightChange: (v: string) => void;
  onRepsChange: (v: string) => void;
  onLog: () => void;
}

function ExerciseCard({
  exercise,
  plannedSets,
  loggedSets,
  previousSets,
  input,
  onWeightChange,
  onRepsChange,
  onLog,
}: ExerciseCardProps) {
  const nextSetIndex = loggedSets.length;
  const prevDataForNext = previousSets[nextSetIndex];
  const hasInput = (input.weight ?? '').trim() !== '' || (input.reps ?? '').trim() !== '';
  const allDone = loggedSets.length >= plannedSets;

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={[
          styles.setProgress,
          allDone ? styles.setProgressDone : undefined,
        ]}>
          {loggedSets.length}/{plannedSets}
        </Text>
        {exercise.muscleGroup ? (
          <View style={styles.muscleTag}>
            <Text style={styles.muscleTagText}>{capitalize(exercise.muscleGroup)}</Text>
          </View>
        ) : null}
      </View>

      {/* Column headers */}
      <View style={styles.colHeaders}>
        <Text style={styles.colSet}>Set</Text>
        <Text style={styles.colPrev}>Previous</Text>
        <Text style={styles.colWeight}>kg</Text>
        <Text style={styles.colReps}>Reps</Text>
        <View style={styles.colAction} />
      </View>

      {/* Completed sets */}
      {loggedSets.map((s, i) => {
        const prevForSet = previousSets[i];
        return (
          <View key={s.id} style={[styles.setRow, styles.setRowCompleted]}>
            <Text style={styles.setNumber}>{s.setNumber}</Text>
            <Text style={styles.prevData}>
              {prevForSet
                ? `${prevForSet.weight ?? '—'} × ${prevForSet.reps ?? '—'}`
                : '—'}
            </Text>
            <View style={styles.completedValues}>
              <Text style={styles.completedWeight}>{s.weight ?? '—'} kg</Text>
              <Text style={styles.completedReps}>{s.reps ?? '—'} reps</Text>
            </View>
            {s.isPR ? (
              <View style={styles.prBadge}>
                <Text style={styles.prText}>PR</Text>
              </View>
            ) : (
              <View style={styles.checkDone}>
                <Ionicons name="checkmark" size={16} color={Colors.primary} />
              </View>
            )}
          </View>
        );
      })}

      {/* Pending set row */}
      <View style={styles.setRow}>
        <Text style={styles.setNumber}>{nextSetIndex + 1}</Text>
        <Text style={styles.prevData}>
          {prevDataForNext
            ? `${prevDataForNext.weight ?? '—'} × ${prevDataForNext.reps ?? '—'}`
            : '—'}
        </Text>
        <TextInput
          style={styles.setInput}
          placeholder={prevDataForNext?.weight != null ? String(prevDataForNext.weight) : '0'}
          placeholderTextColor={Colors.textMuted}
          value={input.weight}
          onChangeText={onWeightChange}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <TextInput
          style={styles.repsInput}
          placeholder={prevDataForNext?.reps != null ? String(prevDataForNext.reps) : '0'}
          placeholderTextColor={Colors.textMuted}
          value={input.reps}
          onChangeText={onRepsChange}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <TouchableOpacity
          style={[styles.logBtn, hasInput && styles.logBtnReady]}
          onPress={onLog}
        >
          {hasInput ? (
            <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.textInverse, letterSpacing: 0.5 }}>LOG</Text>
          ) : (
            <Ionicons name="checkmark" size={16} color={Colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
