import React, { useState } from 'react'

function App() {
  const [formData, setFormData] = useState({
    subject_id: '',
    title: '',
    year: '',
    exam_type: 'WAEC',
    duration_minutes: 60,
    password: ''
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a PDF file.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const submitData = new FormData()
    submitData.append('subject_id', formData.subject_id)
    submitData.append('title', formData.title)
    submitData.append('year', formData.year)
    submitData.append('exam_type', formData.exam_type)
    submitData.append('duration_minutes', formData.duration_minutes)
    submitData.append('file', file)

    try {
      // NOTE: In production, point this to your actual backend domain (e.g. https://api.workshop.com.ng)
      const response = await fetch('https://api.workshop.com.ng/api/data-entry/upload-paper', {
        method: 'POST',
        headers: {
          'X-Admin-Token': formData.password
        },
        body: submitData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to upload paper')
      }

      setMessage({ type: 'success', text: data.message })
      // Reset form but keep subject_id and password for convenience
      setFormData(prev => ({ ...prev, title: '', year: '', exam_type: 'WAEC' }))
      setFile(null)
      e.target.reset()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Data Entry Portal</h1>
        <p>Upload past papers for automatic processing.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Admin Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter admin password"
            required
          />
        </div>

        <div className="form-group">
          <label>Subject ID</label>
          <input
            type="text"
            name="subject_id"
            value={formData.subject_id}
            onChange={handleChange}
            placeholder="e.g. uuid-of-mathematics"
            required
          />
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Mathematics 2023"
            required
          />
        </div>

        <div className="form-group">
          <label>Year</label>
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleChange}
            placeholder="e.g. 2023"
            required
          />
        </div>

        <div className="form-group">
          <label>Exam Type</label>
          <select name="exam_type" value={formData.exam_type} onChange={handleChange}>
            <option value="WAEC">WAEC</option>
            <option value="JAMB">JAMB</option>
            <option value="NECO">NECO</option>
            <option value="GCE">GCE</option>
          </select>
        </div>

        <div className="form-group">
          <label>Duration (Minutes)</label>
          <input
            type="number"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Scanned PDF File</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Uploading & Queuing...' : 'Upload Paper'}
        </button>
      </form>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

export default App
