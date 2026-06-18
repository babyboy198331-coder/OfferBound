import { useEffect, useRef, useState } from 'react'

const ISSUE_LABELS = {
  missingKeyword: 'Missing Keyword',
  formatIssue: 'Format Issue',
  suggestion: 'Recommendation',
}

export default function ScanHintDrawer({ issueType, issueText, resumeText, jobDescription, onClose }) {
  // `history` is the full conversation sent to the API (includes the hidden seed turn).
  // `messages` mirrors it minus anything marked hidden, for rendering.
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const bodyRef = useRef(null)
  const hasInitialized = useRef(false)

  const sendTurn = async (nextHistory) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/fix-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          issueType,
          issueText,
          messages: nextHistory.map(({ role, content }) => ({ role, content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }
      setHistory([...nextHistory, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    const seed = [
      { role: 'user', content: 'Give me a specific, actionable fix for this issue.', hidden: true },
    ]
    setHistory(seed)
    sendTurn(seed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [history, loading])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    const nextHistory = [...history, { role: 'user', content: text }]
    setHistory(nextHistory)
    setInput('')
    sendTurn(nextHistory)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const visibleMessages = history.filter((m) => !m.hidden)

  return (
    <div className="scan-drawer-overlay" onClick={onClose}>
      <div className="scan-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="scan-drawer__header">
          <div className="scan-drawer__header-text">
            <span className="scan-drawer__label">{ISSUE_LABELS[issueType] || 'Issue'}</span>
            <p className="scan-drawer__issue">{issueText}</p>
          </div>
          <button className="scan-drawer__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="scan-drawer__body" ref={bodyRef}>
          {visibleMessages.map((m, i) => (
            <div key={i} className={`scan-chat-bubble scan-chat-bubble--${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="scan-chat-bubble scan-chat-bubble--assistant scan-chat-bubble--typing">
              <span className="scan-typing-dot" />
              <span className="scan-typing-dot" />
              <span className="scan-typing-dot" />
            </div>
          )}
          {error && <p className="scan-field-error scan-drawer__error">{error}</p>}
        </div>

        <div className="scan-drawer__footer">
          <textarea
            className="input scan-chat-input"
            placeholder="Ask a follow-up, request a different rewrite..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
          />
          <button
            className="btn btn--primary scan-chat-send"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
