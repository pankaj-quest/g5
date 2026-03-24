import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface LiveEvent {
  event: string
  distinctId: string
  time: string
  properties: Record<string, unknown>
}

interface RealtimeState {
  liveEvents: LiveEvent[]
  eventsPerInterval: number
  connected: boolean
}

const initialState: RealtimeState = {
  liveEvents: [],
  eventsPerInterval: 0,
  connected: false,
}

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    addLiveEvent(state, action: PayloadAction<LiveEvent>) {
      state.liveEvents = [action.payload, ...state.liveEvents].slice(0, 100) // keep last 100
    },
    setStats(state, action: PayloadAction<{ eventsPerInterval: number }>) {
      state.eventsPerInterval = action.payload.eventsPerInterval
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload
    },
  },
})

export const { addLiveEvent, setStats, setConnected } = realtimeSlice.actions
export default realtimeSlice.reducer
