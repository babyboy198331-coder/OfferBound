import { useState, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import ScanQuickPreview from './ScanQuickPreview'
import ScanJDPreview from './ScanJDPreview'

// Point to the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

const PREVIEW_DEBOUNCE_MS = 900

export default function ScanUpload({ onAnalyze, loading, error }) {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [fileName, setFileName] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [jdPreview, setJdPreview] = useState(null)
  const [jdPreviewLoading, setJdPreviewLoading] = useState(false)
  const fileInputRef = useRef(null)
  const lastPreviewedRef = useRef('')
  const previewTimerRef = useRef(null)
  const previewAbortRef = useRef(null)
  const lastJdPreviewedRef = useRef('')
  const jdPreviewTimerRef = useRef(null)
  const jdPreviewAbortRef = useRef(null)

  // Instant feedback: as soon as resume text is long enough, fetch a quick
  // resume-only preview (skills, role types, rough quality score) — before
  // the user has even pasted a job description.
  useEffect(() => {
    const text = resumeText.trim()

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)

    if (text.length < 50) {
      setPreview(null)
      setPreviewLoading(false)
      lastPreviewedRef.current = ''
      return
    }

    if (text === lastPreviewedRef.current) return

    previewTimerRef.current = setTimeout(async () => {
      if (previewAbortRef.current) previewAbortRef.current.abort()
      const controller = new AbortController()
      previewAbortRef.current = controller

      setPreviewLoading(true)
      try {
        const res = await fetch('/api/preview-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText: text }),
          signal: controller.signal,
        })
        const data = await res.json()
        if (res.ok) {
          setPreview(data)
          lastPreviewedRef.current = text
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Quiet failure — the quick preview is a nice-to-have, not critical.
          console.error('Quick preview failed:', err)
        }
      } finally {
        setPreviewLoading(false)
      }
    }, PREVIEW_DEBOUNCE_MS)

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [resumeText])

  // Same idea, but for the job description: instant required skills,
  // ATS keywords, and a difficulty score as soon as it's pasted in — plus a
  // rough match estimate if a resume is already present.
  useEffect(() => {
    const text = jobDescription.trim()
    const dedupeKey = `${text}::${resumeText.trim().length >= 50 ? resumeText.trim() : ''}`

    if (jdPreviewTimerRef.current) clearTimeout(jdPreviewTimerRef.current)

    if (text.length < 50) {
      setJdPreview(null)
      setJdPreviewLoading(false)
      lastJdPreviewedRef.current = ''
      return
    }

    if (dedupeKey === lastJdPreviewedRef.current) return

    jdPreviewTimerRef.current = setTimeout(async () => {
      if (jdPreviewAbortRef.current) jdPreviewAbortRef.current.abort()
      const controller = new AbortController()
      jdPreviewAbortRef.current = controller

      setJdPreviewLoading(true)
      try {
        const res = await fetch('/api/preview-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription: text,
            resumeText: resumeText.trim().length >= 50 ? resumeText.trim() : undefined,
          }),
          signal: controller.signal,
        })
        const data = await res.json()
        if (res.ok) {
          setJdPreview(data)
          lastJdPreviewedRef.current = dedupeKey
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('JD quick preview failed:', err)
        }
      } finally {
        setJdPreviewLoading(false)
      }
    }, PREVIEW_DEBOUNCE_MS)

    return () => {
      if (jdPreviewTimerRef.current) clearTimeout(jdPreviewTimerRef.current)
    }
  }, [jobDescription, resumeText])

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

          <ScanQuickPreview preview={preview} loading={previewLoading} />
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

          <ScanJDPreview preview={jdPreview} loading={jdPreviewLoading} />
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
