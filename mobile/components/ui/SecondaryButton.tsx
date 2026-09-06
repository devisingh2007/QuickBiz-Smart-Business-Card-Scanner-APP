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

export interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'outline' | 'cream' | 'default' | 'subtle';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

/**
 * Mistral AI Secondary Button
 * 8px radius, restrained hairlines, supporting outline and cream variants.
 */
export function SecondaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'outline',
  style,
  textStyle,
  icon,
}: SecondaryButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'cream':
        return {
          container: styles.creamContainer,
          pressed: styles.creamPressed,
          text: styles.creamText,
        };
      case 'subtle':
        return {
          container: styles.subtleContainer,
          pressed: styles.subtlePressed,
          text: styles.outlineText,
        };
      case 'outline':
      case 'default':
      default:
        return {
          container: styles.outlineContainer,
          pressed: styles.outlinePressed,
          text: styles.outlineText,
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || loading}
      style={[
        styles.button,
        currentVariant.container,
        isPressed && currentVariant.pressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Palette.ink} size="small" />
      ) : (
        <React.Fragment>
          {icon}
          <Text
            style={[
              styles.text,
              currentVariant.text,
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
    borderRadius: BorderRadius.md, // Exact 8px per Mistral design system
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineContainer: {
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.hairlineSoft, // #EDEDED
  },
  outlinePressed: {
    backgroundColor: Palette.surface,
    borderColor: Palette.hairlineStrong,
  },
  outlineText: {
    color: Palette.ink,
  },
  creamContainer: {
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderColor: Palette.beigeDeep, // #E6D5A8
  },
  creamPressed: {
    backgroundColor: Palette.creamDeeper,
  },
  creamText: {
    color: Palette.ink,
  },
  subtleContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  subtlePressed: {
    backgroundColor: Palette.surfaceCreamSoft,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});
