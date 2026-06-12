import { useState, useEffect } from 'react'
import { STATUSES } from './Filters'

const BLANK = {
  company: '',
  role: '',
  link: '',
  location: '',
  status: 'applied',
  dateApplied: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function AppForm({ initial, onSave, onClose }) {
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
      <div className="dialog" role="dialog" aria-modal="true" aria-label={initial ? 'Edit application' : 'Add application'}>
        <div className="dialog__head">
          <h2>{initial ? 'Edit application' : 'Add application'}</h2>
          <button className="dialog__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form__row">
            <div className="form__field">
              <label htmlFor="f-company">Company *</label>
              <input id="f-company" className="input" value={form.company} onChange={set('company')} required autoFocus />
            </div>
            <div className="form__field">
              <label htmlFor="f-role">Role *</label>
              <input id="f-role" className="input" value={form.role} onChange={set('role')} required />
            </div>
          </div>
          <div className="form__row">
            <div className="form__field">
              <label htmlFor="f-status">Status</label>
              <select id="f-status" className="input" value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="form__field">
              <label htmlFor="f-date">Date applied</label>
              <input id="f-date" className="input" type="date" value={form.dateApplied} onChange={set('dateApplied')} />
            </div>
          </div>
          <div className="form__row">
            <div className="form__field">
              <label htmlFor="f-location">Location</label>
              <input id="f-location" className="input" value={form.location} onChange={set('location')} placeholder="Remote, Tulsa OK…" />
            </div>
            <div className="form__field">
              <label htmlFor="f-link">Job posting URL</label>
              <input id="f-link" className="input" type="url" value={form.link} onChange={set('link')} placeholder="https://…" />
            </div>
          </div>
          <div className="form__field">
            <label htmlFor="f-notes">Notes</label>
            <textarea id="f-notes" className="input" rows="3" value={form.notes} onChange={set('notes')} placeholder="Recruiter name, salary range, next steps…" />
          </div>
          <div className="form__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Add application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
