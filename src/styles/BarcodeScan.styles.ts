import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const CORNER = 24;
const BORDER = 3;

export { CORNER, BORDER };

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  permText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 15 },
  backBtn: { paddingVertical: 12 },
  backBtnText: { color: Colors.textMuted, fontSize: 14 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  finder: {
    alignSelf: 'center',
    width: 260,
    height: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: Colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },
  loadingOverlay: { alignItems: 'center', gap: 10 },
  loadingText: { color: '#fff', fontSize: 14 },
  bottomArea: { paddingBottom: 60, paddingHorizontal: 24, alignItems: 'center' },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' },
  notFoundBox: { alignItems: 'center', gap: 16 },
  notFoundText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  notFoundBtns: { flexDirection: 'row', gap: 12 },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  manualBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  manualText: { color: Colors.textInverse, fontWeight: '600' },
});
