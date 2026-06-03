import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: -2,
  },
  sub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  subOver: {
    color: Colors.danger,
  },
});
