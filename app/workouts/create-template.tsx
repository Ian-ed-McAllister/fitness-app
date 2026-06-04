import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useWorkoutStore } from '../../src/store/workoutStore';
import type { DraftTemplateExercise } from '../../src/types/workout';
import { styles } from '../../src/styles/CreateTemplate.styles';

export default function CreateTemplateScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const { templates, draftExercises, addTemplate, editTemplate, setDraftExercises } = useWorkoutStore();

  const isEditing = !!templateId;
  const existingTemplate = isEditing ? templates.find((t) => t.id === templateId) : undefined;

  const [name, setName] = useState(existingTemplate?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [initialized, setInitialized] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!initialized) {
        if (isEditing && existingTemplate) {
          setDraftExercises(
            existingTemplate.exercises.map((te) => ({ exercise: te.exercise, sets: te.defaultSets }))
          );
        }
        setInitialized(true);
      }
    }, [initialized])
  );

  function openExerciseSearch() {
    router.push({ pathname: '/workouts/exercise-search', params: { returnTo: 'template' } });
  }

  function removeExercise(exerciseId: string) {
    setDraftExercises(draftExercises.filter((d) => d.exercise.id !== exerciseId));
  }

  function changeSets(exerciseId: string, delta: number) {
    setDraftExercises(
      draftExercises.map((d) =>
        d.exercise.id === exerciseId
          ? { ...d, sets: Math.max(1, d.sets + delta) }
          : d
      )
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      setNameError('Please enter a template name');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      if (isEditing && templateId) {
        await editTemplate(templateId, name, undefined, draftExercises);
      } else {
        await addTemplate(name, undefined, draftExercises);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Template' : 'New Template'}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Template Name</Text>
          <TextInput
            style={[styles.nameInput, nameError ? { borderWidth: 1, borderColor: Colors.danger } : undefined]}
            placeholder="e.g. Push Day, Legs A…"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={(t) => { setName(t); if (t.trim()) setNameError(''); }}
            autoFocus={!isEditing}
            returnKeyType="done"
          />
          {nameError ? <Text style={{ color: Colors.danger, fontSize: 12, marginTop: -14, marginBottom: 8 }}>{nameError}</Text> : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Exercises</Text>
            <Text style={styles.exerciseCount}>{draftExercises.length} added</Text>
          </View>

          <TouchableOpacity style={styles.addExBtn} onPress={openExerciseSearch}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addExText}>Add Exercises</Text>
          </TouchableOpacity>

          {draftExercises.length === 0 ? (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyExText}>No exercises added yet.{'\n'}Tap above to build your template.</Text>
            </View>
          ) : (
            draftExercises.map((draft) => (
              <View key={draft.exercise.id} style={styles.exerciseItem}>
                <View style={styles.exerciseIcon}>
                  <Ionicons name="barbell-outline" size={18} color={Colors.textSecondary} />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{draft.exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {[draft.exercise.muscleGroup, draft.exercise.equipment]
                      .filter(Boolean)
                      .map(capitalize)
                      .join(' · ')}
                  </Text>
                </View>

                {/* Set count stepper */}
                <View style={styles.setsStepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => changeSets(draft.exercise.id, -1)}
                    hitSlop={8}
                  >
                    <Ionicons name="remove" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.setsLabel}>{draft.sets}</Text>
                  <Text style={styles.setsUnit}>sets</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => changeSets(draft.exercise.id, 1)}
                    hitSlop={8}
                  >
                    <Ionicons name="add" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.removeBtn} onPress={() => removeExercise(draft.exercise.id)}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
