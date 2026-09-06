import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BorderRadius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const { colors, isDark } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'cream':
        return {
          container: {
            backgroundColor: colors.surfaceCream,
            borderColor: colors.borderBeige,
          },
          pressed: {
            backgroundColor: isDark ? '#2E271B' : '#FFF0C2',
          },
          text: {
            color: colors.textPrimary,
          },
        };
      case 'subtle':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
            borderColor: 'transparent',
          },
          pressed: {
            backgroundColor: isDark ? '#202020' : '#FFFAEB',
          },
          text: {
            color: colors.textPrimary,
          },
        };
      case 'outline':
      case 'default':
      default:
        return {
          container: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          pressed: {
            backgroundColor: isDark ? colors.card : colors.surfaceMuted,
            borderColor: colors.borderStrong,
          },
          text: {
            color: colors.textPrimary,
          },
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
        <ActivityIndicator color={colors.textPrimary} size="small" />
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
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
