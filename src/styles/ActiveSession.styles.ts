import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  closeBtn: { padding: 6 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  workoutName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  timer: { fontSize: 12, color: Colors.primary, fontWeight: '600', fontVariant: ['tabular-nums'] },
  finishBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  finishBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 14 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },

  // Exercise card
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  exerciseName: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  setProgress: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginRight: 4 },
  setProgressDone: { color: Colors.primary },
  muscleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.surface2,
  },
  muscleTagText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  // Column headers
  colHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  colSet: { width: 28, fontSize: 11, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  colPrev: { flex: 1, fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  colWeight: { width: 72, fontSize: 11, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  colReps: { width: 56, fontSize: 11, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  colAction: { width: 52 },

  // Set rows
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  setRowCompleted: { opacity: 0.7 },
  setNumber: { width: 28, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  prevData: { flex: 1, fontSize: 12, color: Colors.textMuted },

  setInput: {
    width: 72,
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 6,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  repsInput: {
    width: 56,
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 6,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },

  completedValues: { flex: 1, gap: 1 },
  completedWeight: { fontSize: 14, fontWeight: '700', color: Colors.text },
  completedReps: { fontSize: 12, color: Colors.textMuted },

  logBtn: {
    width: 52,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnReady: { backgroundColor: Colors.primary },

  prBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prText: { fontSize: 9, fontWeight: '800', color: Colors.primary },

  checkDone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addSetText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  // Bottom actions
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addExText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },

  finishWorkoutBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  finishWorkoutText: { fontSize: 16, fontWeight: '700', color: Colors.text },

  // Finish modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 19, fontWeight: '700', color: Colors.text },
  modalSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: -8 },
  notesInput: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
  },
  modalFinishBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFinishText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },
  modalCancel: { alignItems: 'center', paddingVertical: 8 },
  modalCancelText: { fontSize: 15, color: Colors.textMuted },

  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyExTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptyExDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
