import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BorderRadius, Typography, Palette } from '@/constants/theme';

export interface DarkButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

/**
 * Mistral AI Dark Button
 * Pure Ink #1F1F1F surface, 8px radius, white text, pressed state #3D3D3D.
 */
export function DarkButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: DarkButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || loading}
      style={[
        styles.button,
        isPressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <React.Fragment>
          {icon}
          <Text style={[styles.text, icon ? { marginLeft: 8 } : null, textStyle]}>
            {title}
          </Text>
        </React.Fragment>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    minHeight: 44,
    borderRadius: BorderRadius.md, // Exact 8px per Mistral design system
    backgroundColor: Palette.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    backgroundColor: Palette.inkTint, // #3D3D3D
  },
  buttonDisabled: {
    backgroundColor: Palette.stone,
    opacity: 0.6,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});
