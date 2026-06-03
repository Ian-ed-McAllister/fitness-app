import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const variantStyles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.text,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  muted: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textMuted,
  },
});
