import { isFirebaseConfigured } from '../lib/firebase'
import Logo from './Logo'

export default function Header({ user, isPro, onSignOut, onUpgrade, onExport }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <div className="logo">
          <Logo size={22} className="logo__mark" />
          Offer<span className="logo__accent">Bound</span>
          {isPro && <span className="pro-badge">PRO</span>}
        </div>
        <div className="header__right">
          {!isFirebaseConfigured && (
            <span className="badge badge--local" title="Data is saved in this browser. Add your Firebase config to sync across devices.">
              Local mode
            </span>
          )}
          {isPro && (
            <button className="btn btn--ghost btn--sm" onClick={onExport} title="Export applications and bids to CSV">
              ⬇ Export CSV
            </button>
          )}
          {!isPro && (
            <button className="btn btn--primary btn--sm" onClick={onUpgrade}>
              ✨ Upgrade to Pro
            </button>
          )}
          {user && (
            <button className="btn btn--ghost" onClick={onSignOut}>Sign out</button>
          )}
        </div>
      </div>
    </header>
  )
}
