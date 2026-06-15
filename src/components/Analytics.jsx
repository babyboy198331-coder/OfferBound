import { FREE_TIER_LIMIT } from '../lib/stripe'

function Bar({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="analytics__bar-row">
      <span className="analytics__bar-label">{label}</span>
      <div className="analytics__bar-track">
        <div className="analytics__bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="analytics__bar-value">{value}</span>
    </div>
  )
}

export default function Analytics({ apps, bids, isPro, onUpgrade }) {
  if (!isPro) {
    return (
      <div className="analytics analytics--locked">
        <div className="locked-overlay">
          <span className="locked-icon">📊</span>
          <h3>Analytics</h3>
          <p>Upgrade to Pro to see your application insights.</p>
          <button className="btn btn--primary" onClick={onUpgrade}>Upgrade to Pro</button>
        </div>
      </div>
    )
  }

  const statusCounts = {
    applied: apps.filter(a => a.status === 'applied').length,
    interviewing: apps.filter(a => a.status === 'interviewing').length,
    offer: apps.filter(a => a.status === 'offer').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    withdrawn: apps.filter(a => a.status === 'withdrawn').length,
  }

  const maxCount = Math.max(...Object.values(statusCounts), 1)

  // Applications over last 8 weeks
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = now - (8 - i) * weekMs
    const end = start + weekMs
    return {
      label: `W${i + 1}`,
      count: apps.filter(a => a.createdAt >= start && a.createdAt < end).length,
    }
  })
  const maxWeek = Math.max(...weeks.map(w => w.count), 1)

  const responseRate = apps.length
    ? Math.round(((statusCounts.interviewing + statusCounts.offer + statusCounts.rejected) / apps.length) * 100)
    : 0

  const offerRate = apps.length
    ? Math.round((statusCounts.offer / apps.length) * 100)
    : 0

  const pendingBids = bids.filter(b => b.status === 'pending' || b.status === 'negotiating').length
  const acceptedBids = bids.filter(b => b.status === 'accepted').length

  return (
    <div className="analytics">
      <h2 className="analytics__title">📊 Analytics</h2>

      <div className="analytics__grid">
        {/* Status breakdown */}
        <div className="analytics__card">
          <h3>Application Status</h3>
          <Bar label="Applied" value={statusCounts.applied} max={maxCount} color="var(--accent)" />
          <Bar label="Interviewing" value={statusCounts.interviewing} max={maxCount} color="#f59e0b" />
          <Bar label="Offer" value={statusCounts.offer} max={maxCount} color="#10b981" />
          <Bar label="Rejected" value={statusCounts.rejected} max={maxCount} color="#e05c5c" />
          <Bar label="Withdrawn" value={statusCounts.withdrawn} max={maxCount} color="var(--fg-3)" />
        </div>

        {/* Activity over time */}
        <div className="analytics__card">
          <h3>Activity (Last 8 Weeks)</h3>
          <div className="analytics__week-chart">
            {weeks.map((w) => (
              <div key={w.label} className="analytics__week-col">
                <div
                  className="analytics__week-bar"
                  style={{ height: `${Math.max((w.count / maxWeek) * 100, 4)}%` }}
                  title={`${w.count} apps`}
                />
                <span className="analytics__week-label">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key metrics */}
        <div className="analytics__card">
          <h3>Key Metrics</h3>
          <div className="analytics__metrics">
            <div className="analytics__metric">
              <span className="analytics__metric-value">{responseRate}%</span>
              <span className="analytics__metric-label">Response Rate</span>
            </div>
            <div className="analytics__metric">
              <span className="analytics__metric-value analytics__metric-value--green">{offerRate}%</span>
              <span className="analytics__metric-label">Offer Rate</span>
            </div>
            <div className="analytics__metric">
              <span className="analytics__metric-value">{pendingBids}</span>
              <span className="analytics__metric-label">Active Bids</span>
            </div>
            <div className="analytics__metric">
              <span className="analytics__metric-value analytics__metric-value--green">{acceptedBids}</span>
              <span className="analytics__metric-label">Accepted Bids</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
