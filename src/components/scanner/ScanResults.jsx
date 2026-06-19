import { useState } from 'react'
import ScanHintDrawer from './ScanHintDrawer'
import ScanBulletPreview from './ScanBulletPreview'
import ScanRewriteDrawer from './ScanRewriteDrawer'
import { FREE_INSIGHT_LIMIT } from '../../lib/stripe'

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

function IssueRowList({ items, onHint, locked = false, onUpgrade }) {
  if (!items || items.length === 0) return <p className="scan-empty">None identified</p>
  return (
    <ul className="scan-issue-list">
      {items.map((item, i) => (
        <li key={i} className="scan-issue-row">
          <span className="scan-issue-row__text">{item}</span>
          <button className="scan-hint-btn" onClick={() => onHint(item)}>Get AI hint</button>
        </li>
      ))}
      {locked > 0 && (
        <li className="scan-issue-row scan-issue-row--locked">
          <span className="scan-issue-row__text scan-issue-row__text--locked">
            🔒 +{locked} more {locked === 1 ? 'item' : 'items'} found
          </span>
          <button className="scan-hint-btn scan-hint-btn--upgrade" onClick={onUpgrade}>
            Unlock with Pro
          </button>
        </li>
      )}
    </ul>
  )
}

export default function ScanResults({ result, inputs, onReset, isPro, onUpgrade }) {
  const { score, summary, matchedKeywords, missingKeywords, formatIssues, suggestions } = result
  const [activeIssue, setActiveIssue] = useState(null)
  const [showRewrite, setShowRewrite] = useState(false)

  const openHint = (issueType) => (issueText) => setActiveIssue({ issueType, issueText })
  const closeHint = () => setActiveIssue(null)

  const handleFullRewriteClick = () => {
    if (isPro) {
      setShowRewrite(true)
    } else {
      onUpgrade?.('scanInsights')
    }
  }

  const gate = (items) => {
    if (isPro || !items) return { visible: items, locked: 0 }
    return {
      visible: items.slice(0, FREE_INSIGHT_LIMIT),
      locked: Math.max(items.length - FREE_INSIGHT_LIMIT, 0),
    }
  }

  const missingGated = gate(missingKeywords)
  const formatGated = gate(formatIssues)
  const suggestionsGated = gate(suggestions)

  const handleUpgradeClick = () => onUpgrade?.('scanInsights')

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
          <IssueRowList
            items={missingGated.visible}
            onHint={openHint('missingKeyword')}
            locked={missingGated.locked}
            onUpgrade={handleUpgradeClick}
          />
        </div>

        <div className="scan-card">
          <h3 className="scan-card__heading">
            <span className="scan-dot scan-dot--amber" />
            Format Issues
            <span className="scan-count">{formatIssues?.length || 0}</span>
          </h3>
          <IssueRowList
            items={formatGated.visible}
            onHint={openHint('formatIssue')}
            locked={formatGated.locked}
            onUpgrade={handleUpgradeClick}
          />
        </div>

        <div className="scan-card scan-card--suggestions">
          <h3 className="scan-card__heading">
            <span className="scan-dot scan-dot--blue" />
            AI Hints &amp; Recommendations
          </h3>
          <IssueRowList
            items={suggestionsGated.visible}
            onHint={openHint('suggestion')}
            locked={suggestionsGated.locked}
            onUpgrade={handleUpgradeClick}
          />
        </div>

        {inputs && (
          <ScanBulletPreview
            resumeText={inputs.resumeText}
            jobDescription={inputs.jobDescription}
            onUpgrade={onUpgrade}
          />
        )}

        <div className={`scan-card scan-card--rewrite${isPro ? '' : ' scan-card--rewrite-locked'}`}>
          <h3 className="scan-card__heading">
            <span className="scan-dot scan-dot--green" />
            Full AI Resume Rewrite
            {!isPro && <span className="scan-pro-badge">Pro</span>}
          </h3>
          <p className="scan-bullet__intro">
            {isPro
              ? 'Generate a complete, ATS-optimized rewrite of your entire resume, tailored to this job.'
              : 'Unlock a complete, ATS-optimized rewrite of your entire resume — not just one bullet.'}
          </p>
          <button
            className={`btn ${isPro ? 'btn--secondary' : 'btn--primary'} scan-bullet__cta`}
            onClick={handleFullRewriteClick}
          >
            {isPro ? '✨ Generate full rewrite' : '🔒 Unlock with Pro'}
          </button>
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

      {showRewrite && inputs && (
        <ScanRewriteDrawer
          resumeText={inputs.resumeText}
          jobDescription={inputs.jobDescription}
          onClose={() => setShowRewrite(false)}
        />
      )}
    </div>
  )
}
