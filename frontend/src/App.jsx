import { useState } from 'react'
import PreferenceForm from './components/PreferenceForm'
import RestaurantCard from './components/RestaurantCard'
import LoadingState from './components/LoadingState'
import './App.css'

export default function App() {
  const [view, setView] = useState('form') // 'form' | 'loading' | 'results'
  const [statusMessage, setStatusMessage] = useState('Finding your perfect restaurant...')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [lastPrefs, setLastPrefs] = useState(null)

  async function handleSubmit(preferences) {
    setLastPrefs(preferences)
    setView('loading')
    setStatusMessage('Finding your perfect restaurant...')
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/recommend/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'status') {
              setStatusMessage(event.message)
            } else if (event.type === 'complete') {
              setResults(event.data)
              setView('results')
            } else if (event.type === 'error') {
              setError(event.message)
              setView('form')
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      setError(err.message)
      setView('form')
    }
  }

  function handleReset() {
    setView('form')
    setResults(null)
    setError(null)
  }

  function handleSearchAgain() {
    if (lastPrefs) handleSubmit(lastPrefs)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Resierge</span>
          </div>
          <p className="tagline">Your NYC Restaurant Concierge</p>
        </div>
      </header>

      <main className="app-main">
        {view === 'form' && (
          <div className="fade-in">
            {error && (
              <div className="error-banner">
                <span>⚠</span> {error}
              </div>
            )}
            <PreferenceForm onSubmit={handleSubmit} />
          </div>
        )}

        {view === 'loading' && (
          <LoadingState message={statusMessage} />
        )}

        {view === 'results' && results && (
          <div className="results fade-in">
            <div className="results-header">
              <div>
                <h2 className="results-title">Your Recommendations</h2>
                {results.summary && (
                  <p className="results-summary">{results.summary}</p>
                )}
              </div>
              <div className="results-actions">
                <button className="btn-ghost" onClick={handleSearchAgain}>
                  Search Again
                </button>
                <button className="btn-outline" onClick={handleReset}>
                  New Search
                </button>
              </div>
            </div>

            <div className="restaurant-grid">
              {results.restaurants?.map((r, i) => (
                <RestaurantCard key={i} restaurant={r} rank={i + 1} />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Claude AI · NYC Restaurant Concierge</p>
      </footer>
    </div>
  )
}
