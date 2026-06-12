# OfferBound

Track every job application from applied to offer. Built with React, Vite, and Firebase.

**Why I built this:** I was applying to frontend roles and tracking everything in my head.
OfferBound gives me a single dashboard for every application — status, follow-up reminders,
notes from recruiter calls — synced across devices.

## Features

- Application pipeline: Saved → Applied → Interviewing → Offer / Rejected
- Dashboard stats: active applications, interviews, offers, response rate
- Follow-up nudges when an application has gone 7+ days without a response
- Search and status filters
- Google sign-in with per-user cloud data (Firestore)
- Works offline-first: without Firebase config it falls back to localStorage

## Tech stack

React 18 · Vite · Firebase Auth (Google) · Cloud Firestore · CSS (hand-rolled, no framework)

## Run it locally

```bash
npm install
npm run dev
```

## Architecture notes

- `src/lib/firebase.js` — Firebase init; exports `isFirebaseConfigured` so the app
  degrades gracefully to localStorage when no config is present
- `src/lib/storage.js` — single storage API (`subscribe/add/update/delete`) that branches
  between Firestore and localStorage, so components never know which backend they're on
- Firestore data lives at `users/{uid}/applications/{id}`, secured by rules that only
  allow each authenticated user to read/write their own documents

## Deploy

Push to GitHub, import the repo in Vercel, framework preset "Vite" — no env vars needed.
Then add your Vercel domain in Firebase Console → Authentication → Settings →
Authorized domains so Google sign-in works in production.
