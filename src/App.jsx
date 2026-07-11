import { useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:8000'

function App() {
  const [activeTab, setActiveTab] = useState('generate')

  // Generate state
  const [prompt, setPrompt] = useState('')
  const [generateResult, setGenerateResult] = useState(null)
  const [generateError, setGenerateError] = useState(null)
  const [generating, setGenerating] = useState(false)

  // Fix state
  const [fixPrompt, setFixPrompt] = useState('')
  const [projectName, setProjectName] = useState('')
  const [fixResult, setFixResult] = useState(null)
  const [fixError, setFixError] = useState(null)
  const [fixing, setFixing] = useState(false)

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
    } catch (err) {
      setGenerateError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleFix = async (e) => {
    e.preventDefault()
    setFixing(true)
    setFixResult(null)
    setFixError(null)

    try {
      const res = await fetch(`${API_URL}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fixPrompt, project_name: projectName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Fix failed')
      setFixResult(data)
    } catch (err) {
      setFixError(err.message)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Coding Agent</h1>
        <p>AI-powered code generation and fixing</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate
        </button>
        <button
          className={`tab ${activeTab === 'fix' ? 'active' : ''}`}
          onClick={() => setActiveTab('fix')}
        >
          Fix
        </button>
      </div>

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
            <button
              type="submit"
              className="submit-btn generate"
              disabled={generating || !prompt.trim()}
            >
              {generating ? <><span className="spinner" /> Generating...</> : 'Generate Project'}
            </button>
          </form>

          {generateResult && (
            <div className="result success">
              <div className="result-label">Project created successfully!</div>
              <div className="result-value">{generateResult.output_dir}</div>
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

      {activeTab === 'fix' && (
        <div className="card">
          <h2>Fix a Project</h2>
          <p className="subtitle">Describe the issue and the AI will fix it in your generated project</p>
          <form onSubmit={handleFix}>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. phone_calculator"
                required
              />
            </div>
            <div className="form-group">
              <label>What needs fixing?</label>
              <textarea
                value={fixPrompt}
                onChange={(e) => setFixPrompt(e.target.value)}
                placeholder="e.g. The buttons are not aligned properly..."
                required
              />
            </div>
            <button
              type="submit"
              className="submit-btn fix"
              disabled={fixing || !fixPrompt.trim() || !projectName.trim()}
            >
              {fixing ? <><span className="spinner" /> Fixing...</> : 'Fix Project'}
            </button>
          </form>

          {fixResult && (
            <div className="result success">
              <div className="result-label">{fixResult.message}</div>
              <div className="result-value">{fixResult.project_dir}</div>
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
    </div>
  )
}

export default App
