import { configureStore } from '@reduxjs/toolkit'
import authReducer from './auth.slice.js'
import projectReducer from './project.slice.js'
import realtimeReducer from './realtime.slice.js'
import themeReducer from './theme.slice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    realtime: realtimeReducer,
    theme: themeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
