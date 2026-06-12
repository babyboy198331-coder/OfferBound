export const STATUSES = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

export default function Filters({ search, onSearch, statusFilter, onStatusFilter, onAdd }) {
  return (
    <section className="filters">
      <input
        type="search"
        className="input filters__search"
        placeholder="Search company or role…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search applications"
      />
      <div className="filters__tabs" role="tablist" aria-label="Filter by status">
        <button
          className={`tab${statusFilter === 'all' ? ' tab--active' : ''}`}
          onClick={() => onStatusFilter('all')}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            className={`tab${statusFilter === s.value ? ' tab--active' : ''}`}
            onClick={() => onStatusFilter(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button className="btn btn--primary" onClick={onAdd}>
        + Add application
      </button>
    </section>
  )
}
