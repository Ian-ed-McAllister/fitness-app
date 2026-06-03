import React from 'react';
import { View, ViewProps } from 'react-native';
import { styles } from '../../styles/Card.styles';

interface CardProps extends ViewProps {
  padding?: number;
}

export function Card({ style, padding = 16, children, ...props }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
}
