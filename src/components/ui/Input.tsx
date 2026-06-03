import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { styles } from '../../styles/Input.styles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  suffix?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, suffix, containerStyle, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, focused && styles.focused, error && styles.errorBorder]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
