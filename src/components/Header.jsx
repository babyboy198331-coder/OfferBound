import { isFirebaseConfigured } from '../lib/firebase'

export default function Header({ user, onSignOut }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <div className="logo">
          Offer<span className="logo__accent">Bound</span>
        </div>
        <div className="header__right">
          {!isFirebaseConfigured && (
            <span className="badge badge--local" title="Data is saved in this browser. Add your Firebase config to sync across devices.">
              Local mode
            </span>
          )}
          {user && (
            <div className="header__user">
              <button className="btn btn--ghost" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
