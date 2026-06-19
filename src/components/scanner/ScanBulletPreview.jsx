import { useState } from 'react'

export default function ScanBulletPreview({ resumeText, jobDescription, onUpgrade }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [data, setData] = useState(null)

  const fetchRewrite = async () => {
    setState('loading')
    try {
      const res = await fetch('/api/rewrite-bullet', {
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

  if (state === 'idle') {
    return (
      <div className="scan-card scan-card--bullet">
        <h3 className="scan-card__heading">
          <span className="scan-dot scan-dot--blue" />
          AI Bullet Rewrite
        </h3>
        <p className="scan-bullet__intro">
          See how AI would rewrite your weakest bullet point for this job.
        </p>
        <button className="btn btn--secondary scan-bullet__cta" onClick={fetchRewrite}>
          ✨ See an AI rewrite example
        </button>
      </div>
    )
  }

  return (
    <div className="scan-card scan-card--bullet">
      <h3 className="scan-card__heading">
        <span className="scan-dot scan-dot--blue" />
        AI Bullet Rewrite
      </h3>

      {state === 'loading' && (
        <p className="scan-bullet__loading">Finding your weakest bullet…</p>
      )}

      {state === 'error' && (
        <p className="scan-bullet__loading">Couldn't generate a rewrite. Try again in a moment.</p>
      )}

      {state === 'done' && data && (
        <div className="scan-bullet__compare">
          <div className="scan-bullet__block scan-bullet__block--before">
            <span className="scan-bullet__label">Before</span>
            <p>{data.originalBullet}</p>
          </div>
          <div className="scan-bullet__block scan-bullet__block--after">
            <span className="scan-bullet__label">After</span>
            <p>{data.rewrittenBullet}</p>
          </div>
          {data.reason && <p className="scan-bullet__reason">{data.reason}</p>}

          <div className="scan-bullet__upsell">
            <span>Want this for every bullet in your resume?</span>
            <button className="scan-hint-btn scan-hint-btn--upgrade" onClick={() => onUpgrade?.('scanInsights')}>
              Unlock full AI rewrite
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
