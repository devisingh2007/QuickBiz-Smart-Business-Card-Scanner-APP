import React, { useState, } from 'react';
import { View, Text, TextInput, StyleSheet, } from 'react-native';
import { Palette, BorderRadius, Typography, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
/**
 * Mistral AI Input Field
 * White/dark background, 8px radius, 1px subtle hairline border,
 * signature orange focus border, Inter typography, optional left icon.
 */
export function InputField({
  label,
  error,
  disabled = false,
  leftIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) {
  const {
    colors
  } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const handleFocus = e => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  const handleBlur = e => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };
  return <View style={[styles.container, containerStyle]}>
    {label && <Text style={[styles.label, {
      color: colors.textSecondary
    }]}>{label}</Text>}
    <View style={[styles.inputWrapper, {
      backgroundColor: colors.inputBackground,
      borderColor: colors.inputBorder
    }, isFocused && styles.inputWrapperFocused, error ? styles.inputWrapperError : null, disabled && {
      backgroundColor: colors.surface,
      borderColor: colors.borderSoft
    }]}>
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
      <TextInput editable={!disabled} onFocus={handleFocus} onBlur={handleBlur} placeholderTextColor={colors.inputPlaceholder} style={[styles.input, {
        color: colors.textPrimary
      }, leftIcon ? styles.inputWithIcon : null, disabled && {
        color: colors.textTertiary
      }, style]} {...rest} />
    </View>
    {error && <Text style={[styles.errorText, {
      color: colors.error
    }]}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6
  },
  inputWrapper: {
    height: 48,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    // Exact 8px per Mistral design system
    paddingHorizontal: 12
  },
  inputWrapperFocused: {
    borderColor: Palette.primary // Signature #FA520F focus outline
  },
  inputWrapperError: {
    borderColor: Palette.error
  },
  iconContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    paddingVertical: 0
  },
  inputWithIcon: {
    paddingLeft: 0
  },
  errorText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    marginTop: 4
  }
});