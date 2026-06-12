export default function Stats({ apps }) {
  const count = (s) => apps.filter((a) => a.status === s).length
  const applied = count('applied')
  const interviewing = count('interviewing')
  const offers = count('offer')
  const rejected = count('rejected')
  const responses = interviewing + offers + rejected
  const sent = applied + responses
  const responseRate = sent ? Math.round((responses / sent) * 100) : 0

  const items = [
    { label: 'Total', value: apps.length },
    { label: 'Active', value: applied + interviewing },
    { label: 'Interviews', value: interviewing },
    { label: 'Offers', value: offers, accent: offers > 0 },
    { label: 'Response rate', value: `${responseRate}%` },
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
