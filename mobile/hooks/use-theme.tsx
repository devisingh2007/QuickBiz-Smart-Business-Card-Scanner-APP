import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Appearance, ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeColors } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeContextType {
  themePreference: ThemePreference;
  colorScheme: 'light' | 'dark';
  isDark: boolean;
  colors: ThemeColors;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const THEME_PREFERENCE_STORAGE_KEY = '@quickbiz_theme_preference';

const ThemeContext = createContext<ThemeContextType>({
  themePreference: 'system',
  colorScheme: 'light',
  isDark: false,
  colors: Colors.light,
  setThemePreference: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  // Load saved preference from storage
  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemePreferenceState(stored as ThemePreference);
        }
      } catch (err) {
        console.warn('Failed to load theme preference:', err);
      } finally {
        setLoaded(true);
      }
    };
    loadStoredTheme();
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, pref);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  }, []);

  // Compute resolved color scheme
  const resolvedColorScheme: 'light' | 'dark' =
    themePreference === 'system'
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : themePreference === 'dark'
      ? 'dark'
      : 'light';

  const isDark = resolvedColorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        colorScheme: resolvedColorScheme,
        isDark,
        colors,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}

/**
 * Compatible hook matching Expo useColorScheme signature
 */
export function useColorScheme(): 'light' | 'dark' {
  const context = useContext(ThemeContext);
  return context.colorScheme;
}
