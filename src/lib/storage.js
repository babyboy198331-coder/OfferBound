// Storage layer: uses Firestore when Firebase is configured and a user is
// signed in, otherwise falls back to localStorage so the app works instantly.
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'

const LOCAL_KEY = 'offerbound_apps'

// ── localStorage helpers ──
function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []
  } catch {
    return []
  }
}

function writeLocal(apps) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(apps))
}

let localListeners = []

function notifyLocal() {
  const apps = readLocal()
  localListeners.forEach((cb) => cb(apps))
}

// ── public API ──
// subscribe(user, callback) → returns an unsubscribe function
export function subscribeToApplications(user, callback) {
  if (isFirebaseConfigured && user) {
    const q = query(
      collection(db, 'users', user.uid, 'applications'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }
  // local mode
  localListeners.push(callback)
  callback(readLocal())
  return () => {
    localListeners = localListeners.filter((cb) => cb !== callback)
  }
}

export async function addApplication(user, data) {
  const record = { ...data, createdAt: Date.now(), updatedAt: Date.now() }
  if (isFirebaseConfigured && user) {
    await addDoc(collection(db, 'users', user.uid, 'applications'), record)
  } else {
    const apps = readLocal()
    apps.unshift({ ...record, id: crypto.randomUUID() })
    writeLocal(apps)
    notifyLocal()
  }
}

export async function updateApplication(user, id, data) {
  const changes = { ...data, updatedAt: Date.now() }
  if (isFirebaseConfigured && user) {
    await updateDoc(doc(db, 'users', user.uid, 'applications', id), changes)
  } else {
    const apps = readLocal().map((a) => (a.id === id ? { ...a, ...changes } : a))
    writeLocal(apps)
    notifyLocal()
  }
}

export async function deleteApplication(user, id) {
  if (isFirebaseConfigured && user) {
    await deleteDoc(doc(db, 'users', user.uid, 'applications', id))
  } else {
    writeLocal(readLocal().filter((a) => a.id !== id))
    notifyLocal()
  }
}
