import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

type ThemeMode = 'system' | 'light' | 'dark';

type Colors = {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  overlay: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: Colors;
  setMode: (m: ThemeMode) => void;
};

const LIGHT: Colors = {
  bg: '#fafafa',
  card: '#ffffff',
  cardAlt: '#f4f4f5',
  text: '#18181b',
  muted: '#71717a',
  border: '#e4e4e7',
  overlay: 'rgba(0,0,0,0.6)',
};

const DARK: Colors = {
  bg: '#0a0a0c',
  card: '#16161a',
  cardAlt: '#1f1f24',
  text: '#f7f7f9',
  muted: '#71717a',
  border: '#27272a',
  overlay: 'rgba(0,0,0,0.7)',
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  isDark: false,
  colors: LIGHT,
  setMode: () => {},
});

const STORAGE_KEY = 'streak-theme-mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw === 'light' || raw === 'dark' || raw === 'system') {
            setModeState(raw);
          }
        } catch {}
      }
      setLoaded(true);
    })();
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(STORAGE_KEY, m);
      } catch {}
    }
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? DARK : LIGHT;

  if (!loaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}