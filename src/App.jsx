import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './lib/firebase'
import {
  subscribeToApplications, addApplication, updateApplication, deleteApplication,
  subscribeToBids, addBid, updateBid, deleteBid,
  getSubscription,
} from './lib/storage'
import { FREE_TIER_LIMIT } from './lib/stripe'
import { exportToCSV } from './lib/export'
import Header from './components/Header'
import SignIn from './components/SignIn'
import Stats from './components/Stats'
import Filters from './components/Filters'
import ApplicationList from './components/ApplicationList'
import AppForm from './components/AppForm'
import BidList from './components/BidList'
import BidForm from './components/BidForm'
import Analytics from './components/Analytics'
import UpgradeModal from './components/UpgradeModal'
import ResumeScanner from './components/ResumeScanner'

export default function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [apps, setApps] = useState([])
  const [bids, setBids] = useState([])
  const [isPro, setIsPro] = useState(false)
  const [tab, setTab] = useState('applications')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [bidFormOpen, setBidFormOpen] = useState(false)
  const [editingBid, setEditingBid] = useState(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('limit')

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true) })
  }, [])

  useEffect(() => {
    if (!authReady) return
    return subscribeToApplications(user, setApps)
  }, [user, authReady])

  useEffect(() => {
    if (!authReady) return
    return subscribeToBids(user, setBids)
  }, [user, authReady])

  useEffect(() => {
    if (!user) return
    getSubscription(user).then((sub) => setIsPro(sub?.isPro ?? false))
  }, [user])

  // Check success redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('pro') === 'success' && user) {
      import('./lib/storage').then(({ setProStatus }) => {
        setProStatus(user, true).then(() => setIsPro(true))
      })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [user])

  const handleSignOut = () => signOut(auth)

  function tryAddApp() {
    if (!isPro && apps.length >= FREE_TIER_LIMIT) {
      setUpgradeReason('limit')
      setUpgradeOpen(true)
      return
    }
    setEditing(null)
    setFormOpen(true)
  }

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

  function openEdit(app) { setEditing(app); setFormOpen(true) }

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

  function openEditBid(bid) { setEditingBid(bid); setBidFormOpen(true) }

  function handleExportCSV() {
    if (!isPro) { setUpgradeReason('feature'); setUpgradeOpen(true); return }
    exportToCSV(apps, bids)
  }

  function openUpgrade(reason) {
    setUpgradeReason(reason)
    setUpgradeOpen(true)
  }

  const visible = apps.filter((a) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isFirebaseConfigured && authReady && !user) return <SignIn />

  return (
    <>
      <Header
        user={user}
        isPro={isPro}
        onSignOut={handleSignOut}
        onUpgrade={() => { setUpgradeReason('upgrade'); setUpgradeOpen(true) }}
        onExport={handleExportCSV}
      />
      <main className="container">
        <Stats apps={apps} bids={bids} />

        {/* Free tier usage bar */}
        {!isPro && (
          <div className="usage-bar">
            <div className="usage-bar__info">
              <span>{apps.length} / {FREE_TIER_LIMIT} applications used</span>
              <button className="usage-bar__upgrade" onClick={() => { setUpgradeReason('limit'); setUpgradeOpen(true) }}>
                Upgrade for unlimited ✨
              </button>
            </div>
            <div className="usage-bar__track">
              <div
                className={`usage-bar__fill${apps.length >= FREE_TIER_LIMIT ? ' usage-bar__fill--full' : ''}`}
                style={{ width: `${Math.min((apps.length / FREE_TIER_LIMIT) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Tab nav */}
        <div className="tab-nav">
          <button className={`tab-nav__btn${tab === 'applications' ? ' tab-nav__btn--active' : ''}`} onClick={() => setTab('applications')}>
            Applications <span className="tab-nav__count">{apps.length}</span>
          </button>
          <button className={`tab-nav__btn${tab === 'bids' ? ' tab-nav__btn--active' : ''}`} onClick={() => setTab('bids')}>
            Job Bids <span className="tab-nav__count">{bids.length}</span>
          </button>
          <button className={`tab-nav__btn${tab === 'analytics' ? ' tab-nav__btn--active' : ''}`} onClick={() => setTab('analytics')}>
            Analytics {!isPro && <span className="tab-nav__lock">🔒</span>}
          </button>
          <button className={`tab-nav__btn${tab === 'scanner' ? ' tab-nav__btn--active' : ''}`} onClick={() => setTab('scanner')}>
            Resume Scanner ✨
          </button>
        </div>

        {tab === 'applications' && (
          <>
            <Filters
              search={search}
              onSearch={setSearch}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              onAdd={tryAddApp}
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
              <button className="btn btn--primary" onClick={() => { setEditingBid(null); setBidFormOpen(true) }}>
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

        {tab === 'analytics' && (
          <Analytics
            apps={apps}
            bids={bids}
            isPro={isPro}
            onUpgrade={() => { setUpgradeReason('feature'); setUpgradeOpen(true) }}
          />
        )}

        {tab === 'scanner' && (
          <ResumeScanner user={user} isPro={isPro} onUpgrade={openUpgrade} />
        )}
      </main>

      {formOpen && (
        <AppForm initial={editing} onSave={handleSave} onClose={() => { setFormOpen(false); setEditing(null) }} />
      )}
      {bidFormOpen && (
        <BidForm initial={editingBid} onSave={handleBidSave} onClose={() => { setBidFormOpen(false); setEditingBid(null) }} />
      )}
      {upgradeOpen && (
        <UpgradeModal reason={upgradeReason} onClose={() => setUpgradeOpen(false)} />
      )}
    </>
  )
}
