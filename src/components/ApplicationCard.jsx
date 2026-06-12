import { STATUSES } from './Filters'

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function daysSince(iso) {
  if (!iso) return null
  const ms = Date.now() - new Date(iso + 'T00:00:00').getTime()
  return Math.max(0, Math.floor(ms / 86400000))
}

export default function ApplicationCard({ app, onEdit, onDelete, onStatusChange }) {
  const days = daysSince(app.dateApplied)
  const followUpDue =
    app.status === 'applied' && days !== null && days >= 7

  return (
    <li className={`card card--${app.status}`}>
      <div className="card__main">
        <div className="card__heading">
          <h3 className="card__company">{app.company}</h3>
          <select
            className={`status status--${app.status}`}
            value={app.status}
            onChange={(e) => onStatusChange(app, e.target.value)}
            aria-label={`Status for ${app.company}`}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <p className="card__role">{app.role}</p>
        <div className="card__meta">
          {app.location && <span>{app.location}</span>}
          {app.dateApplied && (
            <span>
              Applied {formatDate(app.dateApplied)}
              {days !== null && ` · ${days}d ago`}
            </span>
          )}
          {app.link && (
            <a href={app.link} target="_blank" rel="noreferrer">
              Job posting ↗
            </a>
          )}
        </div>
        {followUpDue && (
          <p className="card__followup">⏰ No response in {days} days — time to follow up</p>
        )}
        {app.notes && <p className="card__notes">{app.notes}</p>}
      </div>
      <div className="card__actions">
        <button className="btn btn--ghost btn--sm" onClick={() => onEdit(app)}>
          Edit
        </button>
        <button className="btn btn--ghost btn--sm btn--danger" onClick={() => onDelete(app)}>
          Delete
        </button>
      </div>
    </li>
  )
}
