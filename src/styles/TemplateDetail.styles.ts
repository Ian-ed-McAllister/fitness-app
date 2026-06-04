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
  optionsBtn: { padding: 8 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  templateName: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: 6 },
  lastPerformed: { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },

  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  startBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },

  historyBtn: {
    borderRadius: 14,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  historyBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  exerciseMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  muscleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.surface2,
  },
  muscleTagText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  // Bottom-sheet modals
  sheetOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    gap: 4,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  sheetSubtitle: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 8 },

  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  sheetActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionIconDanger: { backgroundColor: Colors.dangerMuted },
  sheetActionText: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.text },
  sheetActionTextDanger: { color: Colors.danger },
  sheetDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  sheetCancel: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  sheetCancelText: { fontSize: 15, color: Colors.textMuted, fontWeight: '500' },

  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.danger,
    borderRadius: 14,
    height: 52,
    marginTop: 8,
  },
  dangerBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
});
