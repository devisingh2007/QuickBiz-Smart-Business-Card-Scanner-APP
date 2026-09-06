import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Palette, BorderRadius, Typography } from '@/constants/theme';
import { IconSymbol } from './icon-symbol';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

/**
 * Mistral AI Search Input
 * White canvas surface, 8px radius, 1px subtle hairline border,
 * search magnifying glass icon and clear button.
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search contacts...',
  onClear,
  style,
}: SearchInputProps) {
  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View style={[styles.container, style]}>
      <IconSymbol
        name="magnifyingglass"
        size={16}
        color={Palette.stone}
        style={styles.searchIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.stone}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.clearBtn}
        >
          <IconSymbol name="xmark.circle.fill" size={16} color={Palette.stone} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    minHeight: 44,
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.hairlineSoft,
    borderRadius: BorderRadius.md, // 8px radius
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: Palette.ink,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
});
