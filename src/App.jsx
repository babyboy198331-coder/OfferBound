import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './lib/firebase'
import {
  subscribeToApplications,
  addApplication,
  updateApplication,
  deleteApplication,
  subscribeToBids,
  addBid,
  updateBid,
  deleteBid,
} from './lib/storage'
import Header from './components/Header'
import SignIn from './components/SignIn'
import Stats from './components/Stats'
import Filters from './components/Filters'
import ApplicationList from './components/ApplicationList'
import AppForm from './components/AppForm'
import BidList from './components/BidList'
import BidForm from './components/BidForm'

export default function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [apps, setApps] = useState([])
  const [bids, setBids] = useState([])
  const [tab, setTab] = useState('applications') // 'applications' | 'bids'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [bidFormOpen, setBidFormOpen] = useState(false)
  const [editingBid, setEditingBid] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
    })
  }, [])

  useEffect(() => {
    if (!authReady) return
    return subscribeToApplications(user, setApps)
  }, [user, authReady])

  useEffect(() => {
    if (!authReady) return
    return subscribeToBids(user, setBids)
  }, [user, authReady])

  const handleSignOut = () => signOut(auth)

  // Applications
  async function handleSave(data) {
    if (editing) {
      await updateApplication(user, editing.id, data)
    } else {
      await addApplication(user, data)
    }
    setFormOpen(false)
    setEditing(null)
  }

  async function handleStatusChange(app, status) {
    await updateApplication(user, app.id, { status })
  }

  async function handleDelete(app) {
    if (confirm(`Delete ${app.company} — ${app.role}?`)) {
      await deleteApplication(user, app.id)
    }
  }

  function openEdit(app) {
    setEditing(app)
    setFormOpen(true)
  }

  // Bids
  async function handleBidSave(data) {
    if (editingBid) {
      await updateBid(user, editingBid.id, data)
    } else {
      await addBid(user, data)
    }
    setBidFormOpen(false)
    setEditingBid(null)
  }

  async function handleBidStatusChange(bid, status) {
    await updateBid(user, bid.id, { status })
  }

  async function handleBidDelete(bid) {
    if (confirm(`Delete bid from ${bid.company} — ${bid.role}?`)) {
      await deleteBid(user, bid.id)
    }
  }

  function openEditBid(bid) {
    setEditingBid(bid)
    setBidFormOpen(true)
  }

  const visible = apps.filter((a) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isFirebaseConfigured && authReady && !user) {
    return <SignIn />
  }

  return (
    <>
      <Header user={user} onSignOut={handleSignOut} />
      <main className="container">
        <Stats apps={apps} bids={bids} />

        {/* Tab nav */}
        <div className="tab-nav">
          <button
            className={`tab-nav__btn${tab === 'applications' ? ' tab-nav__btn--active' : ''}`}
            onClick={() => setTab('applications')}
          >
            Applications
            <span className="tab-nav__count">{apps.length}</span>
          </button>
          <button
            className={`tab-nav__btn${tab === 'bids' ? ' tab-nav__btn--active' : ''}`}
            onClick={() => setTab('bids')}
          >
            Job Bids
            <span className="tab-nav__count">{bids.length}</span>
          </button>
        </div>

        {tab === 'applications' && (
          <>
            <Filters
              search={search}
              onSearch={setSearch}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              onAdd={() => { setEditing(null); setFormOpen(true) }}
            />
            <ApplicationList
              apps={visible}
              totalCount={apps.length}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </>
        )}

        {tab === 'bids' && (
          <>
            <div className="filters">
              <button
                className="btn btn--primary"
                onClick={() => { setEditingBid(null); setBidFormOpen(true) }}
              >
                + Add bid
              </button>
            </div>
            <BidList
              bids={bids}
              onEdit={openEditBid}
              onDelete={handleBidDelete}
              onStatusChange={handleBidStatusChange}
              onAdd={() => { setEditingBid(null); setBidFormOpen(true) }}
            />
          </>
        )}
      </main>

      {formOpen && (
        <AppForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        />
      )}

      {bidFormOpen && (
        <BidForm
          initial={editingBid}
          onSave={handleBidSave}
          onClose={() => { setBidFormOpen(false); setEditingBid(null) }}
        />
      )}
    </>
  )
}
