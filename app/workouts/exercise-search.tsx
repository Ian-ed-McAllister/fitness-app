import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { searchExercises, getAllExercises, createCustomExercise } from '../../src/db/workouts';
import { useWorkoutStore } from '../../src/store/workoutStore';
import type { Exercise, MuscleGroup, DraftTemplateExercise } from '../../src/types/workout';
import { styles } from '../../src/styles/ExerciseSearch.styles';

const MUSCLE_GROUPS: Array<MuscleGroup | 'all'> = [
  'all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full body',
];

const EQUIPMENT_TYPES = ['barbell', 'dumbbell', 'machine', 'bodyweight', 'cable', 'kettlebell', 'band'];

export default function ExerciseSearchScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo: 'template' | 'session' }>();
  const { draftExercises, setDraftExercises, addExercisesToSession } = useWorkoutStore();

  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(draftExercises.map((d) => d.exercise.id)));
  const [selectedExercises, setSelectedExercises] = useState<Map<string, Exercise>>(
    new Map(draftExercises.map((d) => [d.exercise.id, d.exercise]))
  );
  const [loading, setLoading] = useState(true);

  // Custom exercise modal
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup | null>(null);
  const [customEquipment, setCustomEquipment] = useState<string | null>(null);
  const [customSaving, setCustomSaving] = useState(false);

  useEffect(() => {
    loadExercises();
  }, [query, muscleFilter]);

  async function loadExercises() {
    setLoading(true);
    try {
      const group = muscleFilter === 'all' ? undefined : muscleFilter;
      const results = query.trim()
        ? await searchExercises(query.trim(), group)
        : await getAllExercises(group);
      setExercises(results);
    } finally {
      setLoading(false);
    }
  }

  function toggleExercise(exercise: Exercise) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
        setSelectedExercises((m) => {
          const nm = new Map(m);
          nm.delete(exercise.id);
          return nm;
        });
      } else {
        next.add(exercise.id);
        setSelectedExercises((m) => new Map(m).set(exercise.id, exercise));
      }
      return next;
    });
  }

  async function handleConfirm() {
    const orderedExercises = Array.from(selectedExercises.values());

    if (returnTo === 'session') {
      await addExercisesToSession(orderedExercises);
    } else {
      const existingIds = new Set(draftExercises.map((d) => d.exercise.id));
      // Preserve existing drafts (with their set counts), add new ones at default 3 sets
      const kept = draftExercises.filter((d) => selected.has(d.exercise.id));
      const newOnes: DraftTemplateExercise[] = orderedExercises
        .filter((e) => !existingIds.has(e.id))
        .map((e) => ({ exercise: e, sets: 3 }));
      setDraftExercises([...kept, ...newOnes]);
    }
    router.back();
  }

  function openCustomModal() {
    setCustomName('');
    setCustomMuscle(null);
    setCustomEquipment(null);
    setCustomModalVisible(true);
  }

  async function handleSaveCustom() {
    if (!customName.trim()) return;
    setCustomSaving(true);
    try {
      const ex = await createCustomExercise(
        customName.trim(),
        customMuscle ?? undefined,
        customEquipment ?? undefined
      );
      setSelectedExercises((m) => new Map(m).set(ex.id, ex));
      setSelected((prev) => new Set(prev).add(ex.id));
      setCustomModalVisible(false);
      await loadExercises();
    } catch {
      Alert.alert('Error', 'Could not create exercise.');
    } finally {
      setCustomSaving(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercises</Text>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>
            {selectedCount > 0 ? `Add (${selectedCount})` : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={MUSCLE_GROUPS}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, muscleFilter === item && styles.filterChipActive]}
            onPress={() => setMuscleFilter(item)}
          >
            <Text style={[styles.filterChipText, muscleFilter === item && styles.filterChipTextActive]}>
              {item === 'all' ? 'All' : capitalize(item)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises found</Text>
              <Text style={styles.emptySubtext}>Try a different search or create a custom one below</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.createCustomBtn} onPress={openCustomModal}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.createCustomText}>Create Custom Exercise</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const isSelected = selected.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.exerciseItem, isSelected && styles.exerciseItemSelected]}
                onPress={() => toggleExercise(item)}
              >
                <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color={Colors.textInverse} />}
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {[item.muscleGroup, item.equipment].filter(Boolean).map(capitalize).join(' · ')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Create custom exercise modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setCustomModalVisible(false)}
          >
            <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>New Exercise</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Exercise name…"
                placeholderTextColor={Colors.textMuted}
                value={customName}
                onChangeText={setCustomName}
                autoFocus
                returnKeyType="done"
              />

              <Text style={styles.modalLabel}>Muscle Group</Text>
              <View style={styles.optionGrid}>
                {(MUSCLE_GROUPS.filter((g) => g !== 'all') as MuscleGroup[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.optionChip, customMuscle === g && styles.optionChipActive]}
                    onPress={() => setCustomMuscle(customMuscle === g ? null : g)}
                  >
                    <Text style={[styles.optionChipText, customMuscle === g && styles.optionChipTextActive]}>
                      {capitalize(g)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Equipment</Text>
              <View style={styles.optionGrid}>
                {EQUIPMENT_TYPES.map((eq) => (
                  <TouchableOpacity
                    key={eq}
                    style={[styles.optionChip, customEquipment === eq && styles.optionChipActive]}
                    onPress={() => setCustomEquipment(customEquipment === eq ? null : eq)}
                  >
                    <Text style={[styles.optionChipText, customEquipment === eq && styles.optionChipTextActive]}>
                      {capitalize(eq)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.modalSaveBtn, (!customName.trim() || customSaving) && styles.modalSaveBtnDisabled]}
                onPress={handleSaveCustom}
                disabled={!customName.trim() || customSaving}
              >
                {customSaving ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} />
                ) : (
                  <Text style={styles.modalSaveText}>Create Exercise</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setCustomModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
