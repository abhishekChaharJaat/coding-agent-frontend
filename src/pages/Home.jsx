import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

function Home() {
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  // Generate state
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState(null)
  const [generateError, setGenerateError] = useState(null)

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`)
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    setGenerateResult(null)
    setGenerateError(null)

    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Generation failed')
      setGenerateResult(data)
      setPrompt('')
      fetchProjects()
    } catch (err) {
      setGenerateError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <div className="header">
        <h1>Coding Agent</h1>
        <p>AI-powered code generation and fixing</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
          Projects
        </button>
        <button className={`tab ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>
          Generate
        </button>
      </div>

      {activeTab === 'projects' && (
        <div className="card">
          <h2>Your Projects</h2>
          <p className="subtitle">Click a project to view files and apply fixes</p>
          {loading ? (
            <div className="loading-state"><span className="spinner" /> Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">No projects yet. Generate one to get started!</div>
          ) : (
            <div className="project-list">
              {projects.map((p) => (
                <Link to={`/project/${p.project_id}`} key={p.project_id} className="project-item">
                  <div className="project-name">{p.name}</div>
                  <div className="project-id">{p.project_id}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="card">
          <h2>Generate a Project</h2>
          <p className="subtitle">Describe what you want to build and the AI will generate it</p>
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label>Your Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build a calculator app with dark theme..."
                required
              />
            </div>
            <button type="submit" className="submit-btn generate" disabled={generating || !prompt.trim()}>
              {generating ? <><span className="spinner" /> Generating...</> : 'Generate Project'}
            </button>
          </form>
          {generateResult && (
            <div className="result success">
              <div className="result-label">Project created!</div>
              <div className="result-value">
                <Link to={`/project/${generateResult.project_id}`}>View Project →</Link>
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
      )}
    </>
  )
}

export default Home
