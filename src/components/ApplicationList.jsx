import ApplicationCard from './ApplicationCard'

export default function ApplicationList({ apps, totalCount, onEdit, onDelete, onStatusChange }) {
  if (totalCount === 0) {
    return (
      <div className="empty">
        <h2>No applications yet</h2>
        <p>Add your first application and start tracking your way to an offer.</p>
      </div>
    )
  }
  if (apps.length === 0) {
    return (
      <div className="empty">
        <h2>Nothing matches</h2>
        <p>Try a different search or status filter.</p>
      </div>
    )
  }
  return (
    <ul className="app-list">
      {apps.map((app) => (
        <ApplicationCard
          key={app.id}
          app={app}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </ul>
  )
}
