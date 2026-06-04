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
  scrollContent: { paddingBottom: 40 },

  hero: { paddingHorizontal: 16, paddingBottom: 16 },
  exerciseName: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: 4 },
  exerciseMeta: { fontSize: 13, color: Colors.textMuted },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 20, fontWeight: '700', color: Colors.text },
  statUnit: { fontSize: 12, color: Colors.textMuted },
  statLabel: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  prVal: { color: Colors.primary },

  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingTop: 16,
    overflow: 'hidden',
  },
  chartTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, paddingHorizontal: 16, marginBottom: 12 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },

  sessionCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  sessionLeft: { flex: 1 },
  sessionDate: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sessionSets: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sessionWeight: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  sessionUnit: { fontSize: 13, color: Colors.textMuted, fontWeight: '400' },
  prBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.primaryMuted,
  },
  prBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.primary },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  chartEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  chartEmptyText: { fontSize: 14, color: Colors.textMuted },

  yLabel: {
    position: 'absolute',
    left: 0,
    width: 36,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
    width: 44,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
