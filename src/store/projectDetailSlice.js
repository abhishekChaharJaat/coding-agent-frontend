import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API_URL = 'http://localhost:8000'

export const fetchProject = createAsyncThunk('projectDetail/fetchProject', async (projectId, { rejectWithValue }) => {
  const res = await fetch(`${API_URL}/projects/${projectId}`)
  if (!res.ok) return rejectWithValue('Project not found')
  return res.json()
})

export const fixProject = createAsyncThunk('projectDetail/fixProject', async ({ prompt, projectId }, { rejectWithValue }) => {
  const res = await fetch(`${API_URL}/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, project_name: projectId }),
  })
  const data = await res.json()
  if (!res.ok) return rejectWithValue(data.detail || 'Fix failed')
  return data
})

const projectDetailSlice = createSlice({
  name: 'projectDetail',
  initialState: {
    project: null,
    loading: true,
    error: null,
    selectedFile: null,
    fixPrompt: '',
    fixing: false,
    fixResult: null,
    fixError: null,
    showFix: false,
  },
  reducers: {
    setSelectedFile(state, action) {
      state.selectedFile = action.payload
    },
    setFixPrompt(state, action) {
      state.fixPrompt = action.payload
    },
    toggleShowFix(state) {
      state.showFix = !state.showFix
    },
    resetDetail(state) {
      state.project = null
      state.loading = true
      state.error = null
      state.selectedFile = null
      state.fixPrompt = ''
      state.fixing = false
      state.fixResult = null
      state.fixError = null
      state.showFix = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.project = action.payload
        state.loading = false
        if (action.payload.files.length > 0 && !state.selectedFile) {
          state.selectedFile = action.payload.files[0].path
        }
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      .addCase(fixProject.pending, (state) => {
        state.fixing = true
        state.fixResult = null
        state.fixError = null
      })
      .addCase(fixProject.fulfilled, (state, action) => {
        state.fixing = false
        state.fixResult = action.payload
        state.fixPrompt = ''
      })
      .addCase(fixProject.rejected, (state, action) => {
        state.fixing = false
        state.fixError = action.payload || action.error.message
      })
  },
})

export const { setSelectedFile, setFixPrompt, toggleShowFix, resetDetail } = projectDetailSlice.actions
export default projectDetailSlice.reducer
