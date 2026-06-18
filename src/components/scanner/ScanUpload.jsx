import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Point to the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

export default function ScanUpload({ onAnalyze, loading, error }) {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [fileName, setFileName] = useState('')
  const [pdfError, setPdfError] = useState('')
  const fileInputRef = useRef(null)

  const processFile = async (file) => {
    if (!file) return

    setPdfError('')

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item) => item.str).join(' ') + '\n'
        }
        const trimmed = text.trim()
        if (trimmed.length < 50) {
          setPdfError(
            "This PDF doesn't have enough extractable text (it may be a scanned image). Try pasting your resume as text instead."
          )
          setResumeText('')
          setFileName('')
          return
        }
        setResumeText(trimmed)
        setFileName(file.name)
      } catch {
        setPdfError('Could not read this PDF. Try pasting your resume as text instead.')
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text()
      const trimmed = text.trim()
      if (trimmed.length < 50) {
        setPdfError("This file doesn't have enough text. Try pasting your resume as text instead.")
        setResumeText('')
        setFileName('')
        return
      }
      setResumeText(trimmed)
      setFileName(file.name)
    } else {
      setPdfError('Please upload a PDF or .txt file.')
    }
  }

  const handleFileUpload = async (e) => {
    await processFile(e.target.files[0])
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleDrop = async (e) => {
    e.preventDefault()
    await processFile(e.dataTransfer.files[0])
  }

  const handleSubmit = () => {
    if (!resumeText.trim() || !jobDescription.trim()) return
    onAnalyze({ resumeText, jobDescription })
  }

  const canSubmit = resumeText.trim().length > 50 && jobDescription.trim().length > 50

  return (
    <div className="scan-upload">
      <div className="scan-upload__grid">
        <div className="scan-card">
          <div className="scan-card__label">
            <span className="scan-card__num">01</span>
            <span>Your Resume</span>
          </div>

          <div
            className={`scan-drop${fileName ? ' scan-drop--has-file' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {fileName ? (
              <>
                <span className="scan-drop__icon">📄</span>
                <span className="scan-drop__filename">{fileName}</span>
                <span className="scan-drop__change">Click to change</span>
              </>
            ) : (
              <>
                <span className="scan-drop__icon">↑</span>
                <span className="scan-drop__label">Upload PDF or .txt</span>
                <span className="scan-drop__sub">or paste below</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {pdfError && <p className="scan-field-error">{pdfError}</p>}

          <textarea
            className="input scan-textarea"
            placeholder="Or paste your resume text here..."
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value)
              setFileName('')
            }}
            rows={10}
          />
        </div>

        <div className="scan-card">
          <div className="scan-card__label">
            <span className="scan-card__num">02</span>
            <span>Job Description</span>
          </div>
          <textarea
            className="input scan-textarea scan-textarea--jd"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={16}
          />
        </div>
      </div>

      {error && <p className="scan-field-error scan-field-error--submit">{error}</p>}

      <div className="scan-submit-row">
        <button
          className="btn btn--primary scan-analyze-btn"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <span className="scan-btn-loading">
              <span className="scan-spinner" />
              Analyzing...
            </span>
          ) : (
            'Scan Resume →'
          )}
        </button>
        {!canSubmit && <p className="scan-hint">Add your resume and job description to continue.</p>}
      </div>
    </div>
  )
}
