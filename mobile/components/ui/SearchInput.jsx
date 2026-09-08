import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, } from 'react-native';
import { BorderRadius, Typography, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
import { IconSymbol, } from './icon-symbol';
/**
 * Mistral AI Search Input
 * White/dark canvas surface, 8px radius, 1px subtle hairline border,
 * search magnifying glass icon and clear button.
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search contacts...',
  onClear,
  style
}) {
  const {
    colors
  } = useTheme();
  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };
  return <View style={[styles.container, {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder
  }, style]}>
      <IconSymbol name="magnifyingglass" size={16} color={colors.inputPlaceholder} style={styles.searchIcon} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.inputPlaceholder} style={[styles.input, {
      color: colors.textPrimary
    }]} autoCapitalize="none" autoCorrect={false} clearButtonMode="never" />
      {value.length > 0 && <TouchableOpacity onPress={handleClear} hitSlop={{
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    }} style={styles.clearBtn}>
          <IconSymbol name="xmark.circle.fill" size={16} color={colors.inputPlaceholder} />
        </TouchableOpacity>}
    </View>;
}
const styles = StyleSheet.create({
  container: {
    height: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    // 8px radius
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  searchIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4
  }
});