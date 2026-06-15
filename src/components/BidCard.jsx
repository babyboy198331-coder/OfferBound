import { BID_STATUSES } from './BidForm'

const STATUS_CLASS = {
  pending:     'badge--pending',
  negotiating: 'badge--interviewing',
  accepted:    'badge--offer',
  declined:    'badge--rejected',
  expired:     'badge--rejected',
}

function formatDeadline(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24))
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (diff < 0) return { label: `${label} (expired)`, urgent: true }
  if (diff === 0) return { label: 'Due today', urgent: true }
  if (diff <= 3) return { label: `${label} (${diff}d left)`, urgent: true }
  return { label, urgent: false }
}

export default function BidCard({ bid, onEdit, onDelete, onStatusChange }) {
  const statusLabel = BID_STATUSES.find((s) => s.value === bid.status)?.label ?? bid.status
  const deadline = formatDeadline(bid.deadline)

  return (
    <li className="card">
      <div className="card__top">
        <div>
          <p className="card__company">{bid.company}</p>
          <p className="card__role">{bid.role}</p>
        </div>
        <span className={`badge ${STATUS_CLASS[bid.status] ?? 'badge--pending'}`}>
          {statusLabel}
        </span>
      </div>

      {(bid.salary || deadline) && (
        <div className="card__meta">
          {bid.salary && (
            <span className="card__meta-item">
              <span className="card__meta-icon">💰</span> {bid.salary}
            </span>
          )}
          {deadline && (
            <span className={`card__meta-item${deadline.urgent ? ' card__meta-item--urgent' : ''}`}>
              <span className="card__meta-icon">⏰</span> {deadline.label}
            </span>
          )}
        </div>
      )}

      {bid.notes && <p className="card__notes">{bid.notes}</p>}

      <div className="card__actions">
        <select
          className="card__status-select"
          value={bid.status}
          onChange={(e) => onStatusChange(bid, e.target.value)}
          aria-label="Change bid status"
          title="Change bid status"
        >
          {BID_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="btn btn--sm btn--ghost" onClick={() => onEdit(bid)} title="Edit this bid">Edit</button>
        <button className="btn btn--sm btn--danger" onClick={() => onDelete(bid)} title="Delete this bid">Delete</button>
      </div>
    </li>
  )
}
