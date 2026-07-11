import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

function ProjectDetail() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Fix state
  const [fixPrompt, setFixPrompt] = useState('')
  const [fixing, setFixing] = useState(false)
  const [fixResult, setFixResult] = useState(null)
  const [fixError, setFixError] = useState(null)
  const [showFix, setShowFix] = useState(false)

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`)
      if (!res.ok) throw new Error('Project not found')
      const data = await res.json()
      setProject(data)
      if (data.files.length > 0) setSelectedFile(data.files[0].path)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const handleFix = async (e) => {
    e.preventDefault()
    setFixing(true)
    setFixResult(null)
    setFixError(null)

    try {
      const res = await fetch(`${API_URL}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fixPrompt, project_name: projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Fix failed')
      setFixResult(data)
      setFixPrompt('')
      // Reload project files to show updated code
      setLoading(true)
      await fetchProject()
    } catch (err) {
      setFixError(err.message)
    } finally {
      setFixing(false)
    }
  }

  const selectedContent = project?.files.find(f => f.path === selectedFile)?.content || ''

  if (loading) return <div className="page-loading"><span className="spinner" /> Loading project...</div>
  if (error) return <div className="page-error">Error: {error}</div>

  return (
    <>
      <div className="detail-header">
        <Link to="/" className="back-link">← Back to Projects</Link>
        <h1>{projectId}</h1>
        <button className={`fix-toggle ${showFix ? 'active' : ''}`} onClick={() => setShowFix(!showFix)}>
          {showFix ? 'Hide Fix Panel' : 'Fix Something'}
        </button>
      </div>

      {showFix && (
        <div className="card fix-panel">
          <h2>Fix this Project</h2>
          <form onSubmit={handleFix}>
            <div className="form-group">
              <label>What needs fixing?</label>
              <textarea
                value={fixPrompt}
                onChange={(e) => setFixPrompt(e.target.value)}
                placeholder="e.g. The buttons are not aligned properly..."
                required
              />
            </div>
            <button type="submit" className="submit-btn fix" disabled={fixing || !fixPrompt.trim()}>
              {fixing ? <><span className="spinner" /> Fixing...</> : 'Apply Fix'}
            </button>
          </form>
          {fixResult && (
            <div className="result success">
              <div className="result-label">{fixResult.message}</div>
            </div>
          )}
          {fixError && (
            <div className="result error">
              <div className="result-label">Error</div>
              <div className="result-value">{fixError}</div>
            </div>
          )}
        </div>
      )}

      <div className="file-viewer">
        <div className="file-sidebar">
          <div className="sidebar-title">Files</div>
          {project.files.map((f) => (
            <button
              key={f.path}
              className={`file-item ${selectedFile === f.path ? 'active' : ''}`}
              onClick={() => setSelectedFile(f.path)}
            >
              {f.path}
            </button>
          ))}
        </div>
        <div className="file-content">
          <div className="file-content-header">{selectedFile}</div>
          <pre className="code-block"><code>{selectedContent}</code></pre>
        </div>
      </div>
    </>
  )
}

export default ProjectDetail
