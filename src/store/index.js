import { configureStore } from '@reduxjs/toolkit'
import projectsReducer from './projectsSlice'
import projectDetailReducer from './projectDetailSlice'

const store = configureStore({
  reducer: {
    projects: projectsReducer,
    projectDetail: projectDetailReducer,
  },
})

export default store
