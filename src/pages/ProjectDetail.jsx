import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import {
  fetchProject,
  fixProject,
  setSelectedFile,
  setFixPrompt,
  toggleShowFix,
  resetDetail,
} from '../store/projectDetailSlice'

function DetailSkeleton() {
  return (
    <div className="detail-skeleton">
      <div className="detail-skeleton-header">
        <div className="detail-skeleton-back" />
        <div className="detail-skeleton-title" />
      </div>
      <div className="detail-skeleton-body">
        <div className="detail-skeleton-panel" />
        <div className="detail-skeleton-panel" />
      </div>
    </div>
  )
}

function ProjectDetail() {
  const { projectId } = useParams()
  const dispatch = useDispatch()
  const {
    project, loading, error, selectedFile,
    fixPrompt, fixing, fixResult, fixError, showFix,
  } = useSelector((state) => state.projectDetail)

  useEffect(() => {
    dispatch(resetDetail())
    dispatch(fetchProject(projectId))
  }, [dispatch, projectId])

  const handleFix = async (e) => {
    e.preventDefault()
    await dispatch(fixProject({ prompt: fixPrompt, projectId })).unwrap()
    dispatch(fetchProject(projectId))
  }

  const selectedContent = project?.files.find(f => f.path === selectedFile)?.content || ''

  const previewDoc = (() => {
    if (!project) return ''
    const filesByExt = (ext) => project.files.filter(f => f.path.endsWith(ext))
    const htmlFile = project.files.find(f => f.path.endsWith('.html'))
    const cssFiles = filesByExt('.css')
    const jsFiles = filesByExt('.js')

    if (htmlFile) {
      let html = htmlFile.content
      html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '')
      html = html.replace(/<script[^>]+src=["'][^"']+["'][^>]*><\/script>/gi, '')
      if (cssFiles.length > 0) {
        const allCss = cssFiles.map(f => f.content).join('\n')
        html = html.replace('</head>', `<style>${allCss}</style>\n</head>`)
      }
      if (jsFiles.length > 0) {
        const allJs = jsFiles.map(f => f.content).join('\n')
        html = html.replace('</body>', `<script>${allJs}<\/script>\n</body>`)
      }
      return html
    }

    const allCss = cssFiles.map(f => f.content).join('\n')
    const allJs = jsFiles.map(f => f.content).join('\n')
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${allCss}</style></head>
<body>${allJs ? `<script>${allJs}<\/script>` : '<p style="color:#888;text-align:center;margin-top:40px;">No HTML file found in this project.</p>'}
</body></html>`
  })()

  if (loading) return <DetailSkeleton />
  if (error) return (
    <div className="page-error">
      <div className="page-error-icon">{'\u2717'}</div>
      <div className="page-error-text">Error: {error}</div>
      <Link to="/" className="back-link" style={{ marginTop: 8 }}>{'\u2190'} Back to Projects</Link>
    </div>
  )

  return (
    <div className="detail-page">
      <div className="detail-header">
        <Link to="/" className="back-link">{'\u2190'} Back</Link>
        <h1>{projectId}</h1>
        <button className={`fix-toggle ${showFix ? 'active' : ''}`} onClick={() => dispatch(toggleShowFix())}>
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
                onChange={(e) => dispatch(setFixPrompt(e.target.value))}
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

      <div className="split-view">
        <div className="split-left">
          <div className="file-viewer">
            <div className="file-sidebar">
              <div className="sidebar-title">Files</div>
              {project.files.map((f) => (
                <button
                  key={f.path}
                  className={`file-item ${selectedFile === f.path ? 'active' : ''}`}
                  onClick={() => dispatch(setSelectedFile(f.path))}
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
        </div>

        <div className="split-right">
          <div className="preview-header">
            <span className="preview-dot red" />
            <span className="preview-dot yellow" />
            <span className="preview-dot green" />
            <span className="preview-url">Preview — {projectId}</span>
          </div>
          <iframe
            className="preview-iframe"
            srcDoc={previewDoc}
            title="Web Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
