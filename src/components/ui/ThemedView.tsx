import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface ThemedViewProps extends ViewProps {
  variant?: 'background' | 'surface' | 'surface2' | 'card';
}

export function ThemedView({ style, variant = 'background', ...props }: ThemedViewProps) {
  const bg = {
    background: Colors.background,
    surface: Colors.surface,
    surface2: Colors.surface2,
    card: Colors.card,
  }[variant];

  return <View style={[{ backgroundColor: bg }, style]} {...props} />;
}
