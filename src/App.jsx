import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from './lib/firebase'
import {
  subscribeToApplications,
  addApplication,
  updateApplication,
  deleteApplication,
} from './lib/storage'
import Header from './components/Header'
import Stats from './components/Stats'
import Filters from './components/Filters'
import ApplicationList from './components/ApplicationList'
import AppForm from './components/AppForm'

export default function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [apps, setApps] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // watch auth state (Firebase mode only)
  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
    })
  }, [])

  // subscribe to applications whenever the user changes
  useEffect(() => {
    if (!authReady) return
    return subscribeToApplications(user, setApps)
  }, [user, authReady])

  const handleSignIn = () => signInWithPopup(auth, googleProvider)
  const handleSignOut = () => signOut(auth)

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

  const visible = apps.filter((a) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <Header
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
      <main className="container">
        <Stats apps={apps} />
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
      </main>
      {formOpen && (
        <AppForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        />
      )}
    </>
  )
}
