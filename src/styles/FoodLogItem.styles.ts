import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  serving: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  macro: {
    fontSize: 11,
    fontWeight: '500',
  },
  dot: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
  },
  cal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  calUnit: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  deleteBtn: {
    padding: 4,
  },
});
