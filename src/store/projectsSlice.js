import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API_URL = 'http://localhost:8000'

export const fetchProjects = createAsyncThunk('projects/fetchProjects', async () => {
  const res = await fetch(`${API_URL}/projects`)
  return res.json()
})

// Streaming generation — dispatches status updates as they arrive
export const generateProjectStream = createAsyncThunk(
  'projects/generateProjectStream',
  async (prompt, { dispatch, rejectWithValue }) => {
    const res = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return rejectWithValue(data.detail || 'Generation failed')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() // keep incomplete chunk

      for (const line of lines) {
        const dataLine = line.trim()
        if (!dataLine.startsWith('data: ')) continue
        try {
          const event = JSON.parse(dataLine.slice(6))
          dispatch(addStreamEvent(event))

          if (event.event === 'complete') {
            return event.data
          }
          if (event.event === 'error') {
            return rejectWithValue(event.message)
          }
        } catch {
          // skip malformed JSON
        }
      }
    }

    return rejectWithValue('Stream ended without completion')
  }
)

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    list: [],
    loading: true,
    prompt: '',
    generating: false,
    generateResult: null,
    generateError: null,
    streamEvents: [],
  },
  reducers: {
    setPrompt(state, action) {
      state.prompt = action.payload
    },
    clearGenerateResult(state) {
      state.generateResult = null
      state.generateError = null
      state.streamEvents = []
    },
    addStreamEvent(state, action) {
      state.streamEvents.push(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.list = action.payload
        state.loading = false
      })
      .addCase(fetchProjects.rejected, (state) => {
        state.loading = false
      })
      .addCase(generateProjectStream.pending, (state) => {
        state.generating = true
        state.generateResult = null
        state.generateError = null
        state.streamEvents = []
      })
      .addCase(generateProjectStream.fulfilled, (state, action) => {
        state.generating = false
        state.generateResult = action.payload
        state.prompt = ''
      })
      .addCase(generateProjectStream.rejected, (state, action) => {
        state.generating = false
        state.generateError = action.payload || action.error.message
      })
  },
})

export const { setPrompt, clearGenerateResult, addStreamEvent } = projectsSlice.actions
export default projectsSlice.reducer
