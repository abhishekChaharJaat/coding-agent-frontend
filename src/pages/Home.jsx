import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProjects, generateProjectStream, setPrompt } from '../store/projectsSlice'

function getStepClass(event, isLast) {
  if (event === 'error') return 'step-error'
  if (event === 'status' || event === 'file_start') {
    return isLast ? 'step-active' : 'step-done'
  }
  if (event === 'complete' || event === 'plan_ready' || event === 'task_ready' || event === 'file_done')
    return 'step-done'
  return 'step-active'
}

function SidebarSkeleton() {
  return (
    <div className="sidebar-skeleton">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="sidebar-skeleton-item" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="sidebar-skeleton-name" />
          <div className="sidebar-skeleton-id" />
        </div>
      ))}
    </div>
  )
}

function Home() {
  const dispatch = useDispatch()
  const { list: projects, loading, prompt, generating, generateResult, generateError, streamEvents } = useSelector((state) => state.projects)

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  const handleGenerate = async (e) => {
    e.preventDefault()
    await dispatch(generateProjectStream(prompt)).unwrap()
    dispatch(fetchProjects())
  }

  // Separate main steps and file events
  const mainSteps = streamEvents.filter(ev => ev.event !== 'file_start' && ev.event !== 'file_done')
  const fileEvents = streamEvents.filter(ev => ev.event === 'file_start' || ev.event === 'file_done')
  const hasFileEvents = fileEvents.length > 0
  const allFilesDone = hasFileEvents && fileEvents[fileEvents.length - 1]?.event === 'file_done' &&
    fileEvents.filter(e => e.event === 'file_done').length === fileEvents.filter(e => e.event === 'file_start').length

  const totalFiles = fileEvents.filter(e => e.event === 'file_start').length
  const doneFiles = fileEvents.filter(e => e.event === 'file_done').length
  const fileProgress = totalFiles > 0 ? (doneFiles / totalFiles) * 100 : 0

  return (
    <div className="home-layout">
      <div className="sidenav">
        <div className="sidenav-brand">
          <span className="brand-icon">{'\u2666'}</span>
          Coding Agent
        </div>
        <div className="sidebar-heading">Projects</div>
        {loading ? (
          <SidebarSkeleton />
        ) : projects.length === 0 ? (
          <div className="empty-state">No projects yet</div>
        ) : (
          <div className="project-list">
            {projects.map((p) => (
              <Link to={`/project/${p.project_id}`} key={p.project_id} className="project-link">
                <div className="project-name">{p.name}</div>
                <div className="project-id">{p.project_id}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="home-main">
          <div className="card">
            <h2>Generate a Project</h2>
            <p className="subtitle">Describe what you want to build and the AI will generate it</p>
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label>Your Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => dispatch(setPrompt(e.target.value))}
                  placeholder="e.g. Build a calculator app with dark theme..."
                  required
                />
              </div>
              <button type="submit" className="submit-btn generate" disabled={generating || !prompt.trim()}>
                {generating ? <><span className="spinner" /> Generating...</> : 'Generate Project'}
              </button>
            </form>

            {generating && streamEvents.length > 0 && (
              <div className="stream-progress">
                <div className="stream-steps">
                  {mainSteps.map((ev, i) => {
                    const isLast = i === mainSteps.length - 1 && !hasFileEvents
                    const stepClass = getStepClass(ev.event, isLast)
                    const isLoading = stepClass === 'step-active'
                    return (
                      <div key={i} className={`stream-step ${stepClass}`}>
                        <span className="step-icon">
                          {isLoading ? <span className="step-spinner" /> : ev.event === 'error' ? '\u2717' : '\u2713'}
                        </span>
                        <div className="step-content">
                          <span className="step-message">{ev.message}</span>
                          {ev.event === 'plan_ready' && ev.data && (
                            <div className="step-sub-details">
                              <span>{ev.data.techstack}</span>
                              <span>{ev.data.file_count} files</span>
                              <span>{ev.data.features.length} features</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {hasFileEvents && (
                    <div className={`stream-step ${allFilesDone ? 'step-done' : 'step-active'}`}>
                      <span className="step-icon">
                        {allFilesDone ? '\u2713' : <span className="step-spinner" />}
                      </span>
                      <div className="step-content">
                        <span className="step-message">
                          Writing Files {totalFiles > 0 && `(${doneFiles}/${totalFiles})`}
                        </span>
                        {totalFiles > 0 && (
                          <div className="step-progress-bar">
                            <div className="step-progress-fill" style={{ width: `${fileProgress}%` }} />
                          </div>
                        )}
                        <div className="file-sub-tasks">
                          {fileEvents.map((fev, j) => {
                            if (fev.event === 'file_start') {
                              const isDone = fileEvents.some(e => e.event === 'file_done' && e.data?.file_path === fev.data?.file_path)
                              return (
                                <div key={j} className={`file-sub-task ${isDone ? 'file-done' : 'file-active'}`}>
                                  <span className="file-sub-icon">
                                    {isDone ? '\u2713' : <span className="step-spinner" />}
                                  </span>
                                  <span className="file-sub-name">{fev.data?.file_path}</span>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {generateResult && (
              <div className="result success">
                <div className="result-label">Project created!</div>
                <div className="result-value">
                  <Link to={`/project/${generateResult.project_id}`}>View Project &rarr;</Link>
                </div>
              </div>
            )}
            {generateError && (
              <div className="result error">
                <div className="result-label">Error</div>
                <div className="result-value">{generateError}</div>
              </div>
            )}
          </div>
      </div>
    </div>
  )
}

export default Home
