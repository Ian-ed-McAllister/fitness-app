import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '../../src/constants/colors';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { styles } from '../../src/styles/TemplateDetail.styles';

export default function TemplateDetailScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const { templates, activeSession, discardActiveSession, setDraftExercises, removeTemplate } =
    useWorkoutStore();

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [resumeVisible, setResumeVisible] = useState(false);
  const [pendingTemplateStart, setPendingTemplateStart] = useState(false);

  const template = templates.find((t) => t.id === templateId);

  if (!template) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Template</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textMuted, fontSize: 15 }}>Template not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  function handleStart() {
    if (activeSession) {
      setResumeVisible(true);
      return;
    }
    router.push({
      pathname: '/workouts/active-session',
      params: { templateId: template.id, templateName: template.name },
    });
  }

  function handleEdit() {
    setOptionsVisible(false);
    setDraftExercises(template.exercises.map((te) => ({ exercise: te.exercise, sets: te.defaultSets })));
    router.push({ pathname: '/workouts/create-template', params: { templateId: template.id } });
  }

  function openDeleteConfirm() {
    setOptionsVisible(false);
    setTimeout(() => setDeleteConfirmVisible(true), 300);
  }

  async function confirmDelete() {
    setDeleteConfirmVisible(false);
    await removeTemplate(template.id);
    router.back();
  }

  async function handleDiscardAndStart() {
    setResumeVisible(false);
    await discardActiveSession();
    router.push({
      pathname: '/workouts/active-session',
      params: { templateId: template.id, templateName: template.name },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{template.name}</Text>
        <TouchableOpacity style={styles.optionsBtn} onPress={() => setOptionsVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.lastPerformed}>
          {template.lastPerformedAt
            ? `Last performed ${formatDistanceToNow(new Date(template.lastPerformedAt), { addSuffix: true })}`
            : 'Never performed'}
        </Text>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() =>
            router.push({ pathname: '/workouts/session-history', params: { templateId: template.id, templateName: template.name } })
          }
        >
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.historyBtnText}>Session History</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          {template.exercises.length} Exercise{template.exercises.length !== 1 ? 's' : ''}
        </Text>

        {template.exercises.map((te, index) => (
          <TouchableOpacity
            key={te.id}
            style={styles.exerciseCard}
            onPress={() =>
              router.push({
                pathname: '/workouts/exercise-progress',
                params: {
                  exerciseId: te.exercise.id,
                  exerciseName: te.exercise.name,
                  exerciseMeta: [te.exercise.muscleGroup, te.exercise.equipment]
                    .filter(Boolean)
                    .map(capitalize)
                    .join(' · '),
                },
              })
            }
          >
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{index + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{te.exercise.name}</Text>
              <Text style={styles.exerciseMeta}>
                {[te.exercise.muscleGroup, te.exercise.equipment]
                  .filter(Boolean)
                  .map(capitalize)
                  .join(' · ')}
              </Text>
            </View>
            {te.exercise.muscleGroup ? (
              <View style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>{capitalize(te.exercise.muscleGroup)}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── Options sheet ─── */}
      <Modal visible={optionsVisible} transparent animationType="slide" onRequestClose={() => setOptionsVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setOptionsVisible(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{template.name}</Text>

            <TouchableOpacity style={styles.sheetAction} onPress={handleEdit}>
              <View style={styles.sheetActionIcon}>
                <Ionicons name="pencil-outline" size={20} color={Colors.text} />
              </View>
              <Text style={styles.sheetActionText}>Edit Template</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            <TouchableOpacity style={styles.sheetAction} onPress={openDeleteConfirm}>
              <View style={[styles.sheetActionIcon, styles.sheetActionIconDanger]}>
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </View>
              <Text style={[styles.sheetActionText, styles.sheetActionTextDanger]}>Delete Template</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.danger} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setOptionsVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Delete confirm sheet ─── */}
      <Modal visible={deleteConfirmVisible} transparent animationType="slide" onRequestClose={() => setDeleteConfirmVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setDeleteConfirmVisible(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Delete Template?</Text>
            <Text style={styles.sheetSubtitle}>
              "{template.name}" and all its session history will be permanently deleted.
            </Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.dangerBtnText}>Delete Template</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setDeleteConfirmVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Active session conflict sheet ─── */}
      <Modal visible={resumeVisible} transparent animationType="slide" onRequestClose={() => setResumeVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setResumeVisible(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Active Workout</Text>
            <Text style={styles.sheetSubtitle}>You already have a workout in progress. What would you like to do?</Text>

            <TouchableOpacity style={styles.sheetAction} onPress={() => { setResumeVisible(false); router.push('/workouts/active-session'); }}>
              <View style={styles.sheetActionIcon}>
                <Ionicons name="play-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={[styles.sheetActionText, { color: Colors.primary }]}>Resume Current Workout</Text>
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            <TouchableOpacity style={styles.sheetAction} onPress={handleDiscardAndStart}>
              <View style={[styles.sheetActionIcon, styles.sheetActionIconDanger]}>
                <Ionicons name="refresh-outline" size={20} color={Colors.danger} />
              </View>
              <Text style={[styles.sheetActionText, styles.sheetActionTextDanger]}>Discard & Start New</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setResumeVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
