import React, { createContext, useContext, useState, useEffect, useCallback, } from 'react';
import { useColorScheme as useRNColorScheme, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, } from '@/constants/theme';
const THEME_PREFERENCE_STORAGE_KEY = '@quickbiz_theme_preference';
const ThemeContext = createContext({
  themePreference: 'system',
  colorScheme: 'light',
  isDark: false,
  colors: Colors.light,
  setThemePreference: async () => {}
});
export function ThemeProvider({
  children
}) {
  const systemColorScheme = useRNColorScheme();
  const [themePreference, setThemePreferenceState] = useState('system');
  const [loaded, setLoaded] = useState(false);

  // Load saved preference from storage
  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemePreferenceState(stored);
        }
      } catch (err) {
        console.warn('Failed to load theme preference:', err);
      } finally {
        setLoaded(true);
      }
    };
    loadStoredTheme();
  }, []);
  const setThemePreference = useCallback(async pref => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, pref);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  }, []);

  // Compute resolved color scheme
  const resolvedColorScheme = themePreference === 'system' ? systemColorScheme === 'dark' ? 'dark' : 'light' : themePreference === 'dark' ? 'dark' : 'light';
  const isDark = resolvedColorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  return <ThemeContext.Provider value={{
    themePreference,
    colorScheme: resolvedColorScheme,
    isDark,
    colors,
    setThemePreference
  }}>
      {children}
    </ThemeContext.Provider>;
}
export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Compatible hook matching Expo useColorScheme signature
 */
export function useColorScheme() {
  const context = useContext(ThemeContext);
  return context.colorScheme;
}