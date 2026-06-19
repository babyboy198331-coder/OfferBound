export default function ScanQuickPreview({ preview, loading }) {
  if (!loading && !preview) return null

  return (
    <div className="scan-preview">
      <div className="scan-preview__header">
        <span className="scan-preview__badge">Quick preview</span>
        {loading && <span className="scan-preview__loading"><span className="scan-spinner scan-spinner--sm" /> Scanning resume...</span>}
      </div>

      {preview && (
        <div className="scan-preview__body">
          <div className="scan-preview__score">
            <span className="scan-preview__score-num">{preview.qualityScore}</span>
            <span className="scan-preview__score-max">/100</span>
            <span className="scan-preview__score-label">resume quality</span>
          </div>

          <div className="scan-preview__details">
            {preview.headline && <p className="scan-preview__headline">{preview.headline}</p>}

            {preview.roleTypes?.length > 0 && (
              <div className="scan-preview__row">
                <span className="scan-preview__row-label">Likely roles</span>
                <div className="scan-tag-list">
                  {preview.roleTypes.map((r, i) => (
                    <span key={i} className="scan-tag scan-tag--role">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {preview.topSkills?.length > 0 && (
              <div className="scan-preview__row">
                <span className="scan-preview__row-label">Skills found</span>
                <div className="scan-tag-list">
                  {preview.topSkills.map((s, i) => (
                    <span key={i} className="scan-tag scan-tag--matched">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="scan-preview__cta">Add a job description for the full ATS match score →</p>
    </div>
  )
}
