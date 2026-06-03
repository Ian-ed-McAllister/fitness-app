import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontWeight: '600',
  },
});

export const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 8, paddingHorizontal: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 18, paddingHorizontal: 32 },
});

export const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
});

export const variantStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.primary },
    text: { color: Colors.textInverse },
  },
  secondary: {
    container: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border },
    text: { color: Colors.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.primary },
  },
  danger: {
    container: { backgroundColor: Colors.danger },
    text: { color: Colors.text },
  },
};
