import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  token: string | null
  userId: string | null
  orgId: string | null
}

const initialState: AuthState = {
  token: localStorage.getItem('g5_jwt'),
  userId: localStorage.getItem('g5_userId'),
  orgId: localStorage.getItem('g5_orgId'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; userId: string; orgId: string }>) {
      state.token = action.payload.token
      state.userId = action.payload.userId
      state.orgId = action.payload.orgId
      localStorage.setItem('g5_jwt', action.payload.token)
      localStorage.setItem('g5_userId', action.payload.userId)
      localStorage.setItem('g5_orgId', action.payload.orgId)
    },
    logout(state) {
      state.token = null
      state.userId = null
      state.orgId = null
      localStorage.removeItem('g5_jwt')
      localStorage.removeItem('g5_userId')
      localStorage.removeItem('g5_orgId')
    },
  },
})

export const { setAuth, logout } = authSlice.actions
export default authSlice.reducer
