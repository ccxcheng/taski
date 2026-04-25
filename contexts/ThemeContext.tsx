import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ThemeName = 'classic' | 'neomorphic' | 'glass'

interface Theme {
  name: ThemeName
  displayName: string
  colors: {
    bg: string
    surface: string
    text: {
      primary: string
      secondary: string
      muted: string
    }
    border: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    inner: string
  }
  borderRadius: {
    button: string
    card: string
    input: string
  }
  fonts: {
    body: string
    display: string
  }
}

export const themes: Record<ThemeName, Theme> = {
  classic: {
    name: 'classic',
    displayName: 'Classic',
    colors: {
      bg: '#fbfbfb',
      surface: '#ffffff',
      text: {
        primary: '#000000',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      border: '#e5e7eb',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    },
    borderRadius: {
      button: '0.5rem',
      card: '0.75rem',
      input: '0.375rem',
    },
    fonts: {
      body: "Menlo, Inconsolata, Monaco, monospace",
      display: "Menlo, Inconsolata, Monaco, monospace",
    },
  },
  neomorphic: {
    name: 'neomorphic',
    displayName: 'Neomorphic',
    colors: {
      bg: '#EFF2F9',
      surface: '#EFF2F9',
      text: {
        primary: '#6E7F8D',
        secondary: '#6E7F8D',
        muted: '#B5BFC6',
      },
      border: '#E4EBF1',
    },
    shadows: {
      sm: '-5px -5px 10px #FAFBFF, 5px 5px 10px rgba(22, 27, 29, 0.23)',
      md: '-10px -10px 20px #FAFBFF, 10px 10px 20px rgba(22, 27, 29, 0.23)',
      lg: '-20px -20px 40px #FAFBFF, 20px 20px 40px rgba(22, 27, 29, 0.23)',
      inner: 'inset 5px 5px 10px rgba(22, 27, 29, 0.23), inset -5px -5px 10px #FAFBFF',
    },
    borderRadius: {
      button: '24px',
      card: '24px',
      input: '24px',
    },
    fonts: {
      body: "Menlo, Inconsolata, Monaco, monospace",
      display: "Menlo, Inconsolata, Monaco, monospace",
    },
  },
  glass: {
    name: 'glass',
    displayName: 'Glass',
    colors: {
      bg: 'linear-gradient(135deg, #e8f4f8 0%, #f0f4f8 50%, #f5f7fa 100%)',
      surface: 'rgba(255, 255, 255, 0.4)',
      text: {
        primary: '#2c3e50',
        secondary: '#34495e',
        muted: 'rgba(44, 62, 80, 0.6)',
      },
      border: 'rgba(255, 255, 255, 0.3)',
    },
    shadows: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.05)',
      md: '0 8px 32px rgba(0, 0, 0, 0.08)',
      lg: '0 16px 48px rgba(0, 0, 0, 0.1)',
      inner: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)',
    },
    borderRadius: {
      button: '16px',
      card: '20px',
      input: '12px',
    },
    fonts: {
      body: "Menlo, Inconsolata, Monaco, monospace",
      display: "Menlo, Inconsolata, Monaco, monospace",
    },
  },
}

interface ThemeContextType {
  currentTheme: ThemeName
  theme: Theme
  setTheme: (theme: ThemeName) => void
  availableThemes: ThemeName[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'taski-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('classic')

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  const setTheme = (themeName: ThemeName) => {
    setCurrentTheme(themeName)
    localStorage.setItem(THEME_STORAGE_KEY, themeName)
  }

  const value: ThemeContextType = {
    currentTheme,
    theme: themes[currentTheme],
    setTheme,
    availableThemes: Object.keys(themes) as ThemeName[],
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
