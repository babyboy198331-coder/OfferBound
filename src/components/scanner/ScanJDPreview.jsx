export default function ScanJDPreview({ preview, loading }) {
  if (!loading && !preview) return null

  const difficultyLabel = (score) =>
    score >= 80 ? 'Highly competitive' : score >= 60 ? 'Competitive' : score >= 40 ? 'Moderate' : 'Accessible'

  return (
    <div className="scan-preview scan-preview--jd">
      <div className="scan-preview__header">
        <span className="scan-preview__badge scan-preview__badge--jd">Quick preview</span>
        {loading && <span className="scan-preview__loading"><span className="scan-spinner scan-spinner--sm" /> Scanning job description...</span>}
      </div>

      {preview && (
        <div className="scan-preview__body">
          <div className="scan-preview__score scan-preview__score--jd">
            <span className="scan-preview__score-num">{preview.difficultyScore}</span>
            <span className="scan-preview__score-max">/100</span>
            <span className="scan-preview__score-label">{difficultyLabel(preview.difficultyScore)}</span>
          </div>

          <div className="scan-preview__details">
            {typeof preview.quickMatchEstimate === 'number' && (
              <p className="scan-preview__headline scan-preview__headline--match">
                Your resume looks like roughly a <strong>{preview.quickMatchEstimate}%</strong> match for this role — run a full scan for the exact breakdown.
              </p>
            )}

            {preview.requiredSkills?.length > 0 && (
              <div className="scan-preview__row">
                <span className="scan-preview__row-label">Required skills</span>
                <div className="scan-tag-list">
                  {preview.requiredSkills.map((s, i) => (
                    <span key={i} className="scan-tag scan-tag--role">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {preview.keywords?.length > 0 && (
              <div className="scan-preview__row">
                <span className="scan-preview__row-label">ATS keywords</span>
                <div className="scan-tag-list">
                  {preview.keywords.map((k, i) => (
                    <span key={i} className="scan-tag scan-tag--matched">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!preview?.quickMatchEstimate && (
        <p className="scan-preview__cta">Add your resume above for an instant match estimate →</p>
      )}
    </div>
  )
}
