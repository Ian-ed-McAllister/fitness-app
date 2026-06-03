import React from 'react';
import { Text, TextProps } from 'react-native';
import { variantStyles } from '../../styles/ThemedText.styles';

interface ThemedTextProps extends TextProps {
  variant?: 'body' | 'title' | 'subtitle' | 'caption' | 'muted' | 'label';
}

export function ThemedText({ style, variant = 'body', ...props }: ThemedTextProps) {
  return <Text style={[variantStyles[variant], style]} {...props} />;
}
