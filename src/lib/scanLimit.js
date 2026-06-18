// Resume Scanner usage tracking: free accounts get a limited number of
// lifetime scans, Pro accounts get unlimited. Mirrors the
// Firestore/localStorage split used in storage.js so it works in local
// mode (no Firebase configured) too.
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'

const LOCAL_KEY = 'offerbound_scan_count'

function readLocalCount() {
  try {
    return parseInt(localStorage.getItem(LOCAL_KEY), 10) || 0
  } catch {
    return 0
  }
}

function writeLocalCount(count) {
  localStorage.setItem(LOCAL_KEY, String(count))
}

export async function getScanCount(user) {
  if (isFirebaseConfigured && user) {
    const snap = await getDoc(doc(db, 'users', user.uid, 'meta', 'scanUsage'))
    return snap.exists() ? snap.data().count || 0 : 0
  }
  return readLocalCount()
}

export async function incrementScanCount(user) {
  if (isFirebaseConfigured && user) {
    const ref = doc(db, 'users', user.uid, 'meta', 'scanUsage')
    const snap = await getDoc(ref)
    const next = (snap.exists() ? snap.data().count || 0 : 0) + 1
    await setDoc(ref, { count: next, updatedAt: Date.now() }, { merge: true })
    return next
  }
  const next = readLocalCount() + 1
  writeLocalCount(next)
  return next
}
