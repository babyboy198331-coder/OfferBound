import { STRIPE_PAYMENT_LINK, PRO_PRICE, FREE_TIER_LIMIT } from '../lib/stripe'

export default function UpgradeModal({ onClose, reason = 'limit' }) {
  const handleUpgrade = () => {
    window.open(STRIPE_PAYMENT_LINK, '_blank')
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog upgrade-modal" role="dialog" aria-modal="true">
        <div className="dialog__head">
          <h2>Upgrade to Pro ✨</h2>
          <button className="dialog__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {reason === 'limit' && (
          <p className="upgrade-modal__reason">
            You've reached the <strong>{FREE_TIER_LIMIT} application</strong> limit on the free plan.
            Upgrade to track unlimited applications.
          </p>
        )}

        <div className="upgrade-modal__plans">
          {/* Free */}
          <div className="plan plan--free">
            <div className="plan__header">
              <h3>Free</h3>
              <span className="plan__price">$0</span>
            </div>
            <ul className="plan__features">
              <li>✓ Up to {FREE_TIER_LIMIT} applications</li>
              <li>✓ Basic dashboard</li>
              <li>✓ Status tracking</li>
              <li>✓ Job bids tracking</li>
            </ul>
          </div>

          {/* Pro */}
          <div className="plan plan--pro">
            <div className="plan__badge">Most Popular</div>
            <div className="plan__header">
              <h3>Pro</h3>
              <span className="plan__price">{PRO_PRICE}<span className="plan__period">/mo</span></span>
            </div>
            <ul className="plan__features">
              <li>✓ <strong>Unlimited</strong> applications</li>
              <li>✓ Resume storage</li>
              <li>✓ Interview scheduling</li>
              <li>✓ Application analytics</li>
              <li>✓ Email reminders</li>
              <li>✓ Export to CSV &amp; PDF</li>
              <li>✓ AI follow-up emails</li>
            </ul>
            <button className="btn btn--primary upgrade-modal__cta" onClick={handleUpgrade}>
              Upgrade to Pro →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
