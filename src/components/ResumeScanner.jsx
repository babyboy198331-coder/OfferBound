import { useEffect, useState } from 'react'
import ScanUpload from './scanner/ScanUpload'
import ScanResults from './scanner/ScanResults'
import { FREE_SCAN_LIMIT } from '../lib/stripe'
import { getScanCount, incrementScanCount } from '../lib/scanLimit'

export default function ResumeScanner({ user, isPro, onUpgrade }) {
  const [scanCount, setScanCount] = useState(0)
  const [countReady, setCountReady] = useState(false)
  const [result, setResult] = useState(null)
  const [inputs, setInputs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getScanCount(user).then((count) => {
      setScanCount(count)
      setCountReady(true)
    })
  }, [user])

  const scansLeft = Math.max(FREE_SCAN_LIMIT - scanCount, 0)
  const limitReached = !isPro && countReady && scanCount >= FREE_SCAN_LIMIT

  const handleAnalyze = async ({ resumeText, jobDescription }) => {
    if (!isPro && scanCount >= FREE_SCAN_LIMIT) {
      onUpgrade('scanLimit')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setResult(data)
        setInputs({ resumeText, jobDescription })
        if (!isPro) {
          const next = await incrementScanCount(user)
          setScanCount(next)
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setInputs(null)
    setError('')
  }

  return (
    <div className="scanner">
      <div className="scanner__intro">
        <p className="scanner__tagline">
          Upload your resume and a job description to get an ATS match score, keyword gaps, and AI-generated hints to fix them.
        </p>
        {!isPro && countReady && (
          <span className={`scanner__usage${limitReached ? ' scanner__usage--full' : ''}`}>
            {limitReached
              ? `Free scans used up for today — `
              : `${scansLeft} of ${FREE_SCAN_LIMIT} free scans left today — `}
            <button className="scanner__upgrade-link" onClick={() => onUpgrade('scanLimit')}>
              upgrade for unlimited ✨
            </button>
          </span>
        )}
      </div>

      {limitReached && !result ? (
        <div className="scanner__locked">
          <span className="scanner__locked-icon">🔒</span>
          <h3>You've used all {FREE_SCAN_LIMIT} free scans for today</h3>
          <p>Come back tomorrow, or upgrade to Pro for unlimited resume scans and AI hints.</p>
          <button className="btn btn--primary" onClick={() => onUpgrade('scanLimit')}>
            Upgrade to Pro →
          </button>
        </div>
      ) : result ? (
        <ScanResults result={result} inputs={inputs} onReset={handleReset} />
      ) : (
        <ScanUpload onAnalyze={handleAnalyze} loading={loading} error={error} />
      )}
    </div>
  )
}
