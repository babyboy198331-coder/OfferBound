export default function Stats({ apps, bids = [] }) {
  const count = (s) => apps.filter((a) => a.status === s).length
  const applied = count('applied')
  const interviewing = count('interviewing')
  const offers = count('offer')
  const rejected = count('rejected')
  const responses = interviewing + offers + rejected
  const sent = applied + responses
  const responseRate = sent ? Math.round((responses / sent) * 100) : 0
  const pendingBids = bids.filter((b) => b.status === 'pending' || b.status === 'negotiating').length
  const acceptedBids = bids.filter((b) => b.status === 'accepted').length

  const items = [
    { label: 'Total Apps', value: apps.length },
    { label: 'Active', value: applied + interviewing },
    { label: 'Interviews', value: interviewing },
    { label: 'Offers', value: offers, accent: offers > 0 },
    { label: 'Response rate', value: `${responseRate}%` },
    { label: 'Bids', value: bids.length },
    { label: 'Pending Bids', value: pendingBids, accent: pendingBids > 0 },
    { label: 'Accepted Bids', value: acceptedBids, accent: acceptedBids > 0 },
  ]

  return (
    <section className="stats" aria-label="Application statistics">
      {items.map((s) => (
        <div key={s.label} className="stats__card">
          <span className={`stats__value${s.accent ? ' stats__value--accent' : ''}`}>
            {s.value}
          </span>
          <span className="stats__label">{s.label}</span>
        </div>
      ))}
    </section>
  )
}
