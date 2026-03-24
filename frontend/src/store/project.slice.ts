import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Project {
  _id: string
  name: string
  token: string
  timezone: string
}

interface ProjectState {
  current: Project | null
  list: Project[]
}

const initialState: ProjectState = {
  current: JSON.parse(localStorage.getItem('g5_currentProject') || 'null'),
  list: [],
}

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<Project[]>) {
      state.list = action.payload
      if (action.payload.length === 0) return
      // Keep current if it's still in the list (refresh data), else pick first
      const match = state.current
        ? action.payload.find((p) => p._id === state.current!._id)
        : null
      state.current = match ?? action.payload[0]
      localStorage.setItem('g5_currentProject', JSON.stringify(state.current))
    },
    switchProject(state, action: PayloadAction<Project>) {
      state.current = action.payload
      localStorage.setItem('g5_currentProject', JSON.stringify(action.payload))
    },
  },
})

export const { setProjects, switchProject } = projectSlice.actions
export default projectSlice.reducer
