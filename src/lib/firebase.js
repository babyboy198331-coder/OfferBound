import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase web app config — these are public client identifiers, safe to commit.
// Data access is protected by Firestore security rules, not by these values.
const firebaseConfig = {
  apiKey: 'AIzaSyDxEfZ9qra9fYy2ps-_pJEFR9bLoDUer30',
  authDomain: 'offerbound-ed972.firebaseapp.com',
  projectId: 'offerbound-ed972',
  storageBucket: 'offerbound-ed972.firebasestorage.app',
  messagingSenderId: '421625265099',
  appId: '1:421625265099:web:58b7abd9493e337399544e',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey)

let app = null
let auth = null
let db = null
let googleProvider = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  googleProvider = new GoogleAuthProvider()
}

export { auth, db, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword }
