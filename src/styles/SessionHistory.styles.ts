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

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionDate: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sessionTime: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  deleteBtn: { padding: 6 },

  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.primaryMuted,
  },
  durationText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  setCountText: { fontSize: 12, color: Colors.textMuted },

  exerciseList: { gap: 4 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
  exerciseRowText: { fontSize: 13, color: Colors.textSecondary },

  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
});
