import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 14 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  exerciseCount: { fontSize: 12, color: Colors.textMuted },

  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  addExText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },

  exerciseItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  exerciseMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  // Set count stepper
  setsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
    marginRight: 6,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setsLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, minWidth: 18, textAlign: 'center' },
  setsUnit: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },

  removeBtn: { padding: 6 },

  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyExText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
