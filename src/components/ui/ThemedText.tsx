import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface ThemedTextProps extends TextProps {
  variant?: 'body' | 'title' | 'subtitle' | 'caption' | 'muted' | 'label';
}

export function ThemedText({ style, variant = 'body', ...props }: ThemedTextProps) {
  const styles = variantStyles[variant];
  return <Text style={[styles, style]} {...props} />;
}

const variantStyles = StyleSheet.create({
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
