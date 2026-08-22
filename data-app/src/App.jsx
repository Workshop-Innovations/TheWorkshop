import React, { useState, useEffect } from 'react'

const API_BASE = 'https://api.workshop.com.ng'
const CORRECT_CODE = 'WorkshopTheGOAT'

// ─── Password Gate ────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code === CORRECT_CODE) {
      onUnlock(code)
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setCode('')
    }
  }

  return (
    <div className="gate-screen">
      <div className={`gate-card${shake ? ' shake' : ''}`}
        style={shake ? { animation: 'shake 0.5s ease' } : {}}>
        <div className="gate-logo">
          <div className="gate-logo-icon"></div>
          <div style={{ textAlign: 'center' }}>
            <h1>Data Entry Portal</h1>
            <p>Enter your access code to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="access-code">Access Code</label>
            <input
              id="access-code"
              type="password"
              value={code}
              onChange={e => { setCode(e.target.value); setError(false) }}
              placeholder="Enter access code..."
              autoFocus
              style={error ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.1)' } : {}}
            />
          </div>
          {error && <p className="gate-error">Incorrect access code. Try again.</p>}
          <button type="submit" className="btn btn-primary">
            Unlock Portal
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────
function App() {
  const [adminToken, setAdminToken] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject_id: '',
    title: '',
    year: new Date().getFullYear().toString(),
    exam_type: 'WAEC',
    duration_minutes: 60,
  })
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Fetch subjects from the backend once unlocked
  useEffect(() => {
    if (!adminToken) return
    setSubjectsLoading(true)
    fetch(`${API_BASE}/api/v1/subjects`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
      .then(r => r.json())
      .then(data => {
        // The API returns an array of subjects; some endpoints may nest them
        const list = Array.isArray(data) ? data : (data.subjects || [])
        setSubjects(list)
        if (list.length > 0) setFormData(p => ({ ...p, subject_id: list[0].id }))
      })
      .catch(() => setSubjects([]))
      .finally(() => setSubjectsLoading(false))
  }, [adminToken])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setFileName(f.name) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setMessage({ type: 'error', text: 'Please select a PDF file.' }); return }
    if (!formData.subject_id) { setMessage({ type: 'error', text: 'Please select a subject.' }); return }

    setLoading(true)
    setMessage(null)

    const body = new FormData()
    body.append('subject_id', formData.subject_id)
    body.append('title', formData.title)
    body.append('year', formData.year)
    body.append('exam_type', formData.exam_type)
    body.append('duration_minutes', formData.duration_minutes)
    body.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/api/data-entry/upload-paper`, {
        method: 'POST',
        headers: { 'X-Admin-Token': adminToken },
        body
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')

      setMessage({ type: 'success', text: `${data.message} (ID: ${data.paper_id})` })
      setFormData(p => ({ ...p, title: '', year: new Date().getFullYear().toString() }))
      setFile(null)
      setFileName('')
      e.target.reset()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!adminToken) {
    return <PasswordGate onUnlock={setAdminToken} />
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon"></div>
        <div className="page-header-text">
          <h1>Data Entry Portal</h1>
          <p>Upload and process scanned past papers with AI</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card">
        <p className="card-title">Paper Details</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Subject */}
            <div className="form-group form-full">
              <label htmlFor="subject_id">Subject</label>
              {subjectsLoading ? (
                <select disabled><option>Loading subjects...</option></select>
              ) : (
                <select
                  id="subject_id"
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">— Select a subject —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Title */}
            <div className="form-group form-full">
              <label htmlFor="title">Paper Title</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Mathematics WAEC 2023"
                required
              />
            </div>

            {/* Year */}
            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input
                id="year"
                type="text"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g. 2023"
                required
              />
            </div>

            {/* Duration */}
            <div className="form-group">
              <label htmlFor="duration_minutes">Duration (mins)</label>
              <input
                id="duration_minutes"
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            {/* Exam Type */}
            <div className="form-group form-full">
              <label htmlFor="exam_type">Exam Type</label>
              <select
                id="exam_type"
                name="exam_type"
                value={formData.exam_type}
                onChange={handleChange}
              >
                <option value="WAEC">WAEC</option>
                <option value="JAMB">JAMB</option>
                <option value="NECO">NECO</option>
                <option value="GCE">GCE</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* PDF Upload */}
            <div className="form-group form-full">
              <label htmlFor="file">Scanned PDF File</label>
              <input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
              />
              {fileName && (
                <p style={{ fontSize: '0.75rem', color: '#0d9488', marginTop: '0.25rem' }}>
                  {fileName}
                </p>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? <><div className="spinner" /> Processing…</>
              : 'Upload & Process Paper'
            }
          </button>
        </form>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="status-bar">
            Uploaded! MinerU is extracting the paper in the background. This may take 2–5 minutes.
          </div>
        )}
      </div>
    </div>
  )
}

export default App
