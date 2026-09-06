import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Palette, BorderRadius, Typography } from '@/constants/theme';

export interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

/**
 * Mistral AI Input Field
 * White background, 8px radius, 1px subtle hairline border,
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
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
          disabled && styles.inputWrapperDisabled,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={Palette.stone}
          style={[
            styles.input,
            leftIcon ? styles.inputWithIcon : null,
            disabled && styles.inputDisabled,
            style,
          ]}
          {...rest}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
    color: Palette.slate, // #4A4A4A
    marginBottom: 6,
  },
  inputWrapper: {
    height: 48,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.canvas, // #FFFFFF
    borderWidth: 1,
    borderColor: Palette.hairlineSoft, // #EDEDED
    borderRadius: BorderRadius.md, // Exact 8px per Mistral design system
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: Palette.primary, // Signature #FA520F focus outline
  },
  inputWrapperError: {
    borderColor: Palette.error,
  },
  inputWrapperDisabled: {
    backgroundColor: Palette.surface,
    borderColor: Palette.hairline,
  },
  iconContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: Palette.ink,
    paddingVertical: 0,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputDisabled: {
    color: Palette.stone,
  },
  errorText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: Palette.error,
    marginTop: 4,
  },
});
