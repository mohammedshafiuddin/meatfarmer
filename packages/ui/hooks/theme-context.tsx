// import { colors, colorsType } from '@/lib/theme-colors';\
import {colors, colorsType} from '../src/lib/theme-colors';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define the theme type
export type Theme = {
  colors: colorsType;
  // Add more theme-level properties as needed (e.g., font, spacing)
};

// 2. Default theme object
export const defaultTheme: Theme = {
  colors: colors,
  // Add more theme-level defaults here
};

// 3. Create the context
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: defaultTheme,
  setTheme: () => {},
});

// 4. Provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 5. useTheme hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
