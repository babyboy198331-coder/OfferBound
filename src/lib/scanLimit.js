// Resume Scanner usage tracking: free accounts get a limited number of
// scans per day, Pro accounts get unlimited. Mirrors the
// Firestore/localStorage split used in storage.js so it works in local
// mode (no Firebase configured) too.
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'

const LOCAL_KEY = 'offerbound_scan_usage'

function todayKey() {
  // Local calendar date, e.g. "2026-06-18"
  return new Date().toLocaleDateString('en-CA')
}

function readLocalUsage() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY))
    if (raw && raw.date === todayKey()) return raw.count || 0
    return 0
  } catch {
    return 0
  }
}

function writeLocalUsage(count) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ date: todayKey(), count }))
}

export async function getScanCount(user) {
  if (isFirebaseConfigured && user) {
    const snap = await getDoc(doc(db, 'users', user.uid, 'meta', 'scanUsage'))
    if (!snap.exists()) return 0
    const data = snap.data()
    if (data.date !== todayKey()) return 0
    return data.count || 0
  }
  return readLocalUsage()
}

export async function incrementScanCount(user) {
  if (isFirebaseConfigured && user) {
    const ref = doc(db, 'users', user.uid, 'meta', 'scanUsage')
    const snap = await getDoc(ref)
    const data = snap.exists() ? snap.data() : null
    const sameDay = data && data.date === todayKey()
    const next = (sameDay ? data.count || 0 : 0) + 1
    await setDoc(ref, { date: todayKey(), count: next, updatedAt: Date.now() }, { merge: true })
    return next
  }
  const next = readLocalUsage() + 1
  writeLocalUsage(next)
  return next
}
