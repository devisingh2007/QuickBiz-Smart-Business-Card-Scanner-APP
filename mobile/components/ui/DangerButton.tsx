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

export interface DangerButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'subtle';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

/**
 * Mistral AI Danger / Destructive Button
 * 8px radius, restrained red accents, supporting solid and subtle variants.
 */
export function DangerButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'subtle',
  style,
  textStyle,
  icon,
}: DangerButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isSubtle = variant === 'subtle';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || loading}
      style={[
        styles.button,
        isSubtle ? styles.buttonSubtle : styles.buttonSolid,
        isPressed && (isSubtle ? styles.buttonSubtlePressed : styles.buttonSolidPressed),
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSubtle ? Palette.error : '#FFFFFF'} size="small" />
      ) : (
        <React.Fragment>
          {icon}
          <Text
            style={[
              styles.text,
              isSubtle ? styles.textSubtle : styles.textSolid,
              icon ? { marginLeft: 8 } : null,
              textStyle,
            ]}
          >
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
    borderRadius: BorderRadius.md, // 8px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonSolid: {
    backgroundColor: Palette.error,
  },
  buttonSolidPressed: {
    backgroundColor: '#B91C1C',
  },
  buttonSubtle: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  buttonSubtlePressed: {
    backgroundColor: '#FEF2F2',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  textSolid: {
    color: '#FFFFFF',
  },
  textSubtle: {
    color: Palette.error,
  },
});
