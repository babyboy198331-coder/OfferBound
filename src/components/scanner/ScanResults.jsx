import { useState } from 'react'
import ScanHintDrawer from './ScanHintDrawer'

function ScoreRing({ score }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? 'var(--accent)' : score >= 60 ? 'var(--amber)' : score >= 40 ? '#f97316' : 'var(--red)'

  const label =
    score >= 80 ? 'Strong Match' : score >= 60 ? 'Moderate Match' : score >= 40 ? 'Weak Match' : 'Poor Match'

  return (
    <div className="scan-score-ring">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--bg-3)" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="70" y="65" textAnchor="middle" className="scan-score-number" fill="var(--fg)">
          {score}
        </text>
        <text x="70" y="82" textAnchor="middle" className="scan-score-pct" fill="var(--fg-3)">
          / 100
        </text>
      </svg>
      <span className="scan-score-label" style={{ color }}>{label}</span>
    </div>
  )
}

function TagList({ items, variant }) {
  if (!items || items.length === 0) return <p className="scan-empty">None identified</p>
  return (
    <div className="scan-tag-list">
      {items.map((item, i) => (
        <span key={i} className={`scan-tag scan-tag--${variant}`}>{item}</span>
      ))}
    </div>
  )
}

function IssueRowList({ items, onHint }) {
  if (!items || items.length === 0) return <p className="scan-empty">None identified</p>
  return (
    <ul className="scan-issue-list">
      {items.map((item, i) => (
        <li key={i} className="scan-issue-row">
          <span className="scan-issue-row__text">{item}</span>
          <button className="scan-hint-btn" onClick={() => onHint(item)}>Get AI hint</button>
        </li>
      ))}
    </ul>
  )
}

export default function ScanResults({ result, inputs, onReset }) {
  const { score, summary, matchedKeywords, missingKeywords, formatIssues, suggestions } = result
  const [activeIssue, setActiveIssue] = useState(null)

  const openHint = (issueType) => (issueText) => setActiveIssue({ issueType, issueText })
  const closeHint = () => setActiveIssue(null)

  return (
    <div className="scan-results">
      <div className="scan-results__header">
        <div className="scan-results__title-row">
          <h2>Scorecard</h2>
          <button className="btn btn--ghost btn--sm" onClick={onReset}>← Scan another</button>
        </div>
        <p className="scan-results__summary">{summary}</p>
      </div>

      <div className="scan-results__grid">
        <div className="scan-card scan-card--score">
          <h3 className="scan-card__heading">ATS Score</h3>
          <ScoreRing score={score} />
        </div>

        <div className="scan-card">
          <h3 className="scan-card__heading">
            <span className="scan-dot scan-dot--green" />
            Matched Keywords
            <span className="scan-count">{matchedKeywords?.length || 0}</span>
          </h3>
          <TagList items={matchedKeywords} variant="matched" />
        </div>

        <div className="scan-card">
          <h3 className="scan-card__heading">
            <span className="scan-dot scan-dot--red" />
            Missing Keywords
            <span className="scan-count">{missingKeywords?.length || 0}</span>
          </h3>
          <IssueRowList items={missingKeywords} onHint={openHint('missingKeyword')} />
        </div>

        <div className="scan-card">
          <h3 className="scan-card__heading">
            <span className="scan-dot scan-dot--amber" />
            Format Issues
            <span className="scan-count">{formatIssues?.length || 0}</span>
          </h3>
          <IssueRowList items={formatIssues} onHint={openHint('formatIssue')} />
        </div>

        <div className="scan-card scan-card--suggestions">
          <h3 className="scan-card__heading">
            <span className="scan-dot scan-dot--blue" />
            AI Hints &amp; Recommendations
          </h3>
          <IssueRowList items={suggestions} onHint={openHint('suggestion')} />
        </div>
      </div>

      {activeIssue && inputs && (
        <ScanHintDrawer
          issueType={activeIssue.issueType}
          issueText={activeIssue.issueText}
          resumeText={inputs.resumeText}
          jobDescription={inputs.jobDescription}
          onClose={closeHint}
        />
      )}
    </div>
  )
}
