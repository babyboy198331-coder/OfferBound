import BidCard from './BidCard'

export default function BidList({ bids, onEdit, onDelete, onStatusChange, onAdd }) {
  if (bids.length === 0) {
    return (
      <div className="empty">
        <h2>No job bids yet</h2>
        <p>When a company makes you an offer or sends a bid, track it here.</p>
        <button className="btn btn--primary" onClick={onAdd} style={{ marginTop: '1rem' }}>
          + Add bid
        </button>
      </div>
    )
  }
  return (
    <ul className="app-list">
      {bids.map((bid) => (
        <BidCard
          key={bid.id}
          bid={bid}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </ul>
  )
}
