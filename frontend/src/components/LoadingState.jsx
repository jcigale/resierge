import './LoadingState.css'

export default function LoadingState({ message }) {
  return (
    <div className="loading-container fade-in">
      <div className="loading-card">
        <div className="loading-icon">
          <div className="spinner" />
          <span className="loading-star">✦</span>
        </div>
        <h2 className="loading-title">Resierge is on it</h2>
        <p className="loading-message">{message}</p>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}
