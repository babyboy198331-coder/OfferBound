import { useState, useEffect } from 'react'

export const BID_STATUSES = [
  { value: 'pending',     label: 'Pending' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'accepted',    label: 'Accepted' },
  { value: 'declined',    label: 'Declined' },
  { value: 'expired',     label: 'Expired' },
]

const BLANK = {
  company: '',
  role: '',
  salary: '',
  deadline: '',
  status: 'pending',
  notes: '',
}

export default function BidForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...BLANK, ...initial } : BLANK)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) return
    setSaving(true)
    const { id, createdAt, updatedAt, ...data } = form
    await onSave(data)
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={initial ? 'Edit bid' : 'Add bid'}>
        <div className="dialog__head">
          <h2>{initial ? 'Edit bid' : 'Add job bid'}</h2>
          <button className="dialog__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form__row">
            <div className="form__field">
              <label htmlFor="b-company">Company *</label>
              <input id="b-company" className="input" value={form.company} onChange={set('company')} required autoFocus />
            </div>
            <div className="form__field">
              <label htmlFor="b-role">Role *</label>
              <input id="b-role" className="input" value={form.role} onChange={set('role')} required />
            </div>
          </div>
          <div className="form__row">
            <div className="form__field">
              <label htmlFor="b-salary">Offered Salary / Rate</label>
              <input id="b-salary" className="input" value={form.salary} onChange={set('salary')} placeholder="e.g. $85,000 / yr or $60/hr" />
            </div>
            <div className="form__field">
              <label htmlFor="b-deadline">Response Deadline</label>
              <input id="b-deadline" className="input" type="date" value={form.deadline} onChange={set('deadline')} />
            </div>
          </div>
          <div className="form__field">
            <label htmlFor="b-status">Status</label>
            <select id="b-status" className="input" value={form.status} onChange={set('status')}>
              {BID_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="form__field">
            <label htmlFor="b-notes">Notes</label>
            <textarea id="b-notes" className="input" rows="3" value={form.notes} onChange={set('notes')} placeholder="Benefits, recruiter name, counter-offer details…" />
          </div>
          <div className="form__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Add bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
