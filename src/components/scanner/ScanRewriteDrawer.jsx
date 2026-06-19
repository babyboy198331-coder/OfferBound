import { useEffect, useRef, useState } from 'react'

export default function ScanRewriteDrawer({ resumeText, jobDescription, onClose }) {
  const [state, setState] = useState('loading') // loading | done | error
  const [data, setData] = useState(null)
  const [copied, setCopied] = useState(false)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const run = async () => {
      try {
        const res = await fetch('/api/rewrite-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText, jobDescription }),
        })
        const json = await res.json()
        if (!res.ok) {
          setState('error')
          return
        }
        setData(json)
        setState('done')
      } catch {
        setState('error')
      }
    }
    run()
  }, [resumeText, jobDescription])

  const handleCopy = async () => {
    if (!data?.rewrittenResume) return
    try {
      await navigator.clipboard.writeText(data.rewrittenResume)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be unavailable; silently ignore
    }
  }

  return (
    <div className="scan-drawer-overlay" onClick={onClose}>
      <div className="scan-drawer scan-drawer--wide" onClick={(e) => e.stopPropagation()}>
        <div className="scan-drawer__header">
          <div className="scan-drawer__header-text">
            <span className="scan-drawer__label">Full AI Resume Rewrite</span>
            <p className="scan-drawer__issue">Tailored to your job description</p>
          </div>
          <button className="scan-drawer__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="scan-drawer__body">
          {state === 'loading' && (
            <div className="scan-chat-bubble scan-chat-bubble--assistant scan-chat-bubble--typing">
              <span className="scan-typing-dot" />
              <span className="scan-typing-dot" />
              <span className="scan-typing-dot" />
            </div>
          )}

          {state === 'error' && (
            <p className="scan-field-error scan-drawer__error">
              Couldn't generate the rewrite. Please try again.
            </p>
          )}

          {state === 'done' && data && (
            <>
              {data.summaryOfChanges?.length > 0 && (
                <div className="scan-rewrite__changes">
                  <span className="scan-bullet__label">What changed</span>
                  <ul>
                    {data.summaryOfChanges.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <pre className="scan-rewrite__text">{data.rewrittenResume}</pre>
            </>
          )}
        </div>

        {state === 'done' && (
          <div className="scan-drawer__footer">
            <button className="btn btn--primary scan-chat-send" onClick={handleCopy}>
              {copied ? 'Copied ✓' : 'Copy to clipboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
