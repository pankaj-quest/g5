import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Theme = 'dark' | 'light'

export interface ThemeState {
  theme: Theme
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('g5_theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

const initialState: ThemeState = {
  theme: getInitialTheme(),
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
      localStorage.setItem('g5_theme', action.payload)
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('g5_theme', state.theme)
    },
  },
})

export const { setTheme, toggleTheme } = themeSlice.actions
export default themeSlice.reducer
