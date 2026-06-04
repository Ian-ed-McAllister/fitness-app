import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '../../src/constants/colors';
import { useWorkoutStore } from '../../src/store/workoutStore';
import type { WorkoutTemplate } from '../../src/types/workout';
import { styles } from '../../src/styles/WorkoutsTab.styles';

// What action was pending when the active-session conflict appeared
type PendingAction =
  | { type: 'empty' }
  | { type: 'template'; template: WorkoutTemplate };

export default function WorkoutsTab() {
  const router = useRouter();
  const { templates, activeSession, isLoading, loadTemplates, removeTemplate, discardActiveSession, clearDraftExercises } =
    useWorkoutStore();

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [conflictAction, setConflictAction] = useState<PendingAction | null>(null);

  useEffect(() => { loadTemplates(); }, []);
  useFocusEffect(useCallback(() => { loadTemplates(); }, []));

  function handleStartEmpty() {
    if (activeSession) { setConflictAction({ type: 'empty' }); return; }
    router.push({ pathname: '/workouts/active-session', params: { mode: 'empty' } });
  }

  function handleStartTemplate(template: WorkoutTemplate) {
    if (activeSession) { setConflictAction({ type: 'template', template }); return; }
    router.push({ pathname: '/workouts/active-session', params: { templateId: template.id, templateName: template.name } });
  }

  function handleCreateTemplate() {
    clearDraftExercises();
    router.push('/workouts/create-template');
  }

  async function handleDiscardAndContinue() {
    if (!conflictAction) return;
    setConflictAction(null);
    await discardActiveSession();
    if (conflictAction.type === 'empty') {
      router.push({ pathname: '/workouts/active-session', params: { mode: 'empty' } });
    } else {
      router.push({ pathname: '/workouts/active-session', params: { templateId: conflictAction.template.id, templateName: conflictAction.template.name } });
    }
  }

  const muscleGroupsFor = (template: WorkoutTemplate) => {
    const groups = template.exercises.map((te) => te.exercise.muscleGroup).filter(Boolean) as string[];
    return [...new Set(groups)].slice(0, 3);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateTemplate}>
          <Ionicons name="add" size={16} color={Colors.textInverse} />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {isLoading && templates.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {activeSession ? (
            <TouchableOpacity style={styles.resumeBanner} onPress={() => router.push('/workouts/active-session')}>
              <View style={styles.resumeIcon}>
                <Ionicons name="fitness" size={18} color={Colors.textInverse} />
              </View>
              <View style={styles.resumeText}>
                <Text style={styles.resumeTitle}>{activeSession.name}</Text>
                <Text style={styles.resumeSubtitle}>
                  Started {formatDistanceToNow(new Date(activeSession.startedAt), { addSuffix: true })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} style={styles.resumeChevron} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.emptyWorkoutBtn} onPress={handleStartEmpty}>
            <Ionicons name="flash-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.emptyWorkoutText}>Start Empty Workout</Text>
          </TouchableOpacity>

          {templates.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>My Templates</Text>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => router.push({ pathname: '/workouts/template-detail', params: { templateId: template.id } })}
                  onLongPress={() => setDeleteTarget({ id: template.id, name: template.name })}
                >
                  <View style={styles.templateCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.lastPerformed}>
                        {template.lastPerformedAt
                          ? `Last: ${formatDistanceToNow(new Date(template.lastPerformedAt), { addSuffix: true })}`
                          : 'Never performed'}
                      </Text>
                    </View>
                  </View>

                  {muscleGroupsFor(template).length > 0 && (
                    <View style={styles.muscleTagRow}>
                      {muscleGroupsFor(template).map((g) => (
                        <View key={g} style={styles.muscleTag}>
                          <Text style={styles.muscleTagText}>{capitalize(g)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.templateMeta}>
                    {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                  </Text>

                  <TouchableOpacity style={styles.startBtn} onPress={() => handleStartTemplate(template)}>
                    <Text style={styles.startBtnText}>Start Workout</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Templates Yet</Text>
              <Text style={styles.emptyDesc}>
                Create a template to quickly start your favourite workouts, or jump straight into an empty workout.
              </Text>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateTemplate}>
                <Ionicons name="add" size={16} color={Colors.textInverse} />
                <Text style={styles.createBtnText}>Create Template</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* ─── Active workout conflict sheet ─── */}
      <Modal visible={!!conflictAction} transparent animationType="slide" onRequestClose={() => setConflictAction(null)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setConflictAction(null)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Active Workout</Text>
            <Text style={styles.sheetSubtitle}>
              You already have "{activeSession?.name}" in progress. What would you like to do?
            </Text>

            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => { setConflictAction(null); router.push('/workouts/active-session'); }}
            >
              <View style={styles.sheetActionIcon}>
                <Ionicons name="play-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={[styles.sheetActionText, { color: Colors.primary }]}>Resume Current Workout</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            <TouchableOpacity style={styles.sheetAction} onPress={handleDiscardAndContinue}>
              <View style={[styles.sheetActionIcon, styles.sheetActionIconDanger]}>
                <Ionicons name="refresh-outline" size={20} color={Colors.danger} />
              </View>
              <Text style={[styles.sheetActionText, styles.sheetActionTextDanger]}>
                {conflictAction?.type === 'template'
                  ? `Discard & Start "${conflictAction.template.name}"`
                  : 'Discard & Start Empty Workout'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setConflictAction(null)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Delete confirmation sheet ─── */}
      <Modal visible={!!deleteTarget} transparent animationType="slide" onRequestClose={() => setDeleteTarget(null)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setDeleteTarget(null)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Delete Template?</Text>
            <Text style={styles.sheetSubtitle}>
              "{deleteTarget?.name}" and all its session history will be permanently deleted.
            </Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={async () => { if (!deleteTarget) return; await removeTemplate(deleteTarget.id); setDeleteTarget(null); }}>
              <Ionicons name="trash-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.dangerBtnText}>Delete Template</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setDeleteTarget(null)}>
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
