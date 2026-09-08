import React, { useState, } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Text, } from 'react-native';
import { BorderRadius, Typography, Palette, } from '@/constants/theme';
/**
 * Mistral AI Primary Button
 * Saturated Orange #FA520F background, 8px radius, white text, pressed state #CC3A05.
 */
export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) {
  const [isPressed, setIsPressed] = useState(false);
  return <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={() => setIsPressed(true)} onPressOut={() => setIsPressed(false)} disabled={disabled || loading} style={[styles.button, isPressed && styles.buttonPressed, disabled && styles.buttonDisabled, style]}>
      {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <>
          {icon}
          <Text style={[styles.text, icon ? {
        marginLeft: 8
      } : null, textStyle]}>
            {title}
          </Text>
        </>}
    </TouchableOpacity>;
}
const styles = StyleSheet.create({
  button: {
    height: 48,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    // Exact 8px per Mistral design system
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  buttonPressed: {
    backgroundColor: Palette.primaryDeep // #CC3A05
  },
  buttonDisabled: {
    backgroundColor: Palette.stone,
    opacity: 0.6
  },
  text: {
    color: Palette.onPrimary,
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.1
  }
});